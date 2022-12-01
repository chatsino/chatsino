import { validateTicket } from "auth";
import * as config from "config";
import { Request } from "express";
import { createLogger } from "logger";
import { Client, ClientIdentifier } from "persistence";
import { PUBLISHER, SUBSCRIBER } from "persistence";
import {
  clientSubscriptionSchema,
  socketErrorResponseSchema,
  socketSuccessResponseSchema,
  SourcedSocketMessage,
  sourcedSocketRequestSchema,
} from "schemas";
import { Duplex } from "stream";
import { RawData, WebSocket, WebSocketServer } from "ws";

export interface SocketRequest {
  kind: string;
  args: Record<string, unknown>;
}

export interface SourcedSocketRequest extends SocketRequest {
  from: Client;
}

export interface SocketResponse {
  to: number;
  kind: string;
}

export interface SocketSuccessResponse extends SocketResponse {
  data: unknown;
}

export interface SocketErrorResponse extends SocketResponse {
  error: unknown;
}

export interface SocketClientSubscription {
  clientIdentifier: ClientIdentifier;
  subscription: string;
}

export interface SocketSubscriptionPublished {
  subscription: string;
  data: object;
}

export enum SocketResponseKind {
  SuccessResponse = "success-response",
  ErrorResponse = "error-response",
  BroadcastToSubscription = "broadcast-to-subscription",
  BroadcastToAll = "broadcast-to-all",
  ClientSubscribed = "client-subscribed",
}

export const SOCKETS_LOGGER = createLogger("Sockets");

export class SocketServer {
  private server = new WebSocketServer({ noServer: true });
  private clients = new Map<WebSocket, Client>();
  private heartbeats = new Map<WebSocket, boolean>();
  private subscriptions: Record<string, Set<WebSocket>> = {};
  public checkingConnectionStatuses: NodeJS.Timeout;

  public constructor() {
    this.server.on("connection", this.handleConnection.bind(this));
    this.checkingConnectionStatuses = this.checkConnectionStatuses();

    SUBSCRIBER.subscribe(SocketResponseKind.SuccessResponse, (message) =>
      this.sendSuccessResponse(JSON.parse(message))
    );
    SUBSCRIBER.subscribe(SocketResponseKind.ErrorResponse, (message) =>
      this.sendErrorResponse(JSON.parse(message))
    );
    SUBSCRIBER.subscribe(
      SocketResponseKind.BroadcastToSubscription,
      (message) => this.broadcastToSubscription(JSON.parse(message))
    );
    SUBSCRIBER.subscribe(SocketResponseKind.BroadcastToAll, (message) =>
      this.broadcastToAll(JSON.parse(message))
    );
    SUBSCRIBER.subscribe(SocketResponseKind.ClientSubscribed, (message) =>
      this.handleClientSubscription(JSON.parse(message))
    );
  }

  public async handleUpgrade(request: Request, socket: Duplex, head: Buffer) {
    SOCKETS_LOGGER.info(
      "Received a request to upgrade to a WebSocket connection."
    );

    const client = await validateTicket(request);

    if (!client) {
      SOCKETS_LOGGER.info("The request to upgrade was denied.");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      return socket.destroy();
    }

    const websocket = await new Promise<WebSocket>((resolve) =>
      this.server.handleUpgrade(request, socket, head, resolve)
    );

    this.clients.set(websocket, client);

    return this.server.emit("connection", websocket);
  }

  private handleConnection(websocket: WebSocket) {
    SOCKETS_LOGGER.info(
      {
        client: this.clients.get(websocket),
      },
      "A client connected."
    );

    websocket.on("message", (data) =>
      this.receiveSocketMessage(websocket, data)
    );
    websocket.on("pong", () => this.heartbeart(websocket));
    websocket.on("close", () => this.terminate(websocket));
  }

  private terminate(websocket: WebSocket) {
    SOCKETS_LOGGER.info(
      {
        client: this.clients.get(websocket),
      },
      "A client disconnected."
    );

    this.clients.delete(websocket);
    this.clearSubscriptions(websocket);
  }

  private heartbeart(websocket: WebSocket) {
    const client = this.clients.get(websocket);

    if (client) {
      this.clients.set(websocket, client);
      this.heartbeats.set(websocket, true);
    }
  }

  private async receiveSocketMessage(websocket: WebSocket, data: RawData) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(websocket);

      SOCKETS_LOGGER.info({ message, client }, "A client sent a message.");

      if (!client) {
        throw new CannotVerifyMessageError();
      }

      const sourcedSocketRequest = await sourcedSocketRequestSchema.validate({
        ...message,
        from: client,
      });

      SOCKETS_LOGGER.info({ kind: message.kind }, "Publishing a message.");

      PUBLISHER.publish(
        sourcedSocketRequest.kind,
        JSON.stringify(sourcedSocketRequest)
      );
    } catch (error) {
      SOCKETS_LOGGER.error({ error }, "Failed to handle a client message.");
    }
  }

  private getClientWebsockets(clientIdentifier: ClientIdentifier) {
    return [...this.clients.entries()]
      .filter((entry) => {
        const [_, client] = entry;

        SOCKETS_LOGGER.info({
          id: client.id,
          username: client.username,
          clientIdentifier,
        });

        return typeof clientIdentifier === "number"
          ? client.id === clientIdentifier
          : client.username === clientIdentifier;
      })
      .map((entry) => entry[0]);
  }

  private sendSocketMessage<T extends object>(
    clientIdentifier: ClientIdentifier,
    message: T
  ) {
    for (const websocket of this.getClientWebsockets(clientIdentifier)) {
      if (websocket.readyState === websocket.OPEN) {
        websocket.send(JSON.stringify(message));
      }
    }
  }

  private async sendSuccessResponse({ to, kind, data }: SocketSuccessResponse) {
    try {
      await socketSuccessResponseSchema.validate({ to, kind, data });

      return this.sendSocketMessage(to, {
        kind,
        data,
      });
    } catch (error) {
      SOCKETS_LOGGER.error(
        { to, kind, data, error },
        "Failed to send a success message."
      );
    }
  }

  private async sendErrorResponse({ to, kind, error }: SocketErrorResponse) {
    try {
      await socketErrorResponseSchema.validate({ to, kind, error });

      return this.sendSocketMessage(to, {
        kind,
        error,
      });
    } catch (e) {
      SOCKETS_LOGGER.error(
        { to, kind, error, thrown: e },
        "Failed to send an error message."
      );
    }
  }

  private broadcastToSubscription({
    subscription,
    data,
  }: SocketSubscriptionPublished) {
    const subscribers = this.subscriptions[subscription];

    for (const websocket of [...subscribers]) {
      if (websocket.readyState === websocket.OPEN) {
        websocket.send(JSON.stringify(data));
      }
    }
  }

  private broadcastToAll(data: object) {
    for (const websocket of this.clients.keys()) {
      if (websocket.readyState === websocket.OPEN) {
        websocket.send(JSON.stringify(data));
      }
    }
  }

  private async handleClientSubscription({
    kind,
    args,
    from,
  }: SourcedSocketMessage) {
    SOCKETS_LOGGER.info(
      { kind, args, from: from.id },
      "A client has subscribed."
    );

    const { subscription } = await clientSubscriptionSchema.validate(args);

    if (!this.subscriptions[subscription]) {
      this.subscriptions[subscription] = new Set();
    }

    for (const websocket of this.getClientWebsockets(from.id)) {
      this.subscriptions[subscription].add(websocket);

      const client = this.clients.get(websocket);

      if (client) {
        return this.sendSuccessResponse({
          to: client.id,
          kind: SocketResponseKind.ClientSubscribed,
          data: {
            message: `${client.username} is subscribed to ${subscription}`,
          },
        });
      }
    }
  }

  private clearSubscriptions(websocket: WebSocket) {
    for (const subscribers of Object.values(this.subscriptions)) {
      subscribers.delete(websocket);
    }
  }

  private checkConnectionStatuses() {
    return setTimeout(() => {
      SOCKETS_LOGGER.info("Checking connection statuses.");

      const { clients } = this.server;

      if (clients.size > 0) {
        let terminatedConnections = 0;

        for (const websocket of clients) {
          if (this.heartbeats.get(websocket)) {
            this.heartbeats.set(websocket, false);
            websocket.ping();
          } else {
            this.terminate(websocket);
            websocket.terminate();
            terminatedConnections++;
          }
        }

        SOCKETS_LOGGER.info(
          { terminatedConnections },
          "Checked connection statuses."
        );

        this.checkingConnectionStatuses = this.checkConnectionStatuses();
      }
    }, config.CONNECTION_STATUS_CHECK_RATE_MS);
  }
}

export class CannotVerifyMessageError extends Error {}
