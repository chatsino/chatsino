import { validateTicket } from "auth";
import * as config from "config";
import { Request } from "express";
import { createLogger } from "logger";
import { Client } from "persistence";
import { PUBLISHER, SUBSCRIBER } from "persistence";
import {
  socketErrorResponseSchema,
  socketSuccessResponseSchema,
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

export enum SocketResponseKind {
  SuccessResponse = "success-response",
  ErrorResponse = "error-response",
}

export const SOCKETS_LOGGER = createLogger("Sockets");

export class CannotVerifyMessageError extends Error {}

export class SocketServer {
  server = new WebSocketServer({ noServer: true });
  clients = new Map<WebSocket, Client>();
  heartbeats = new Map<WebSocket, boolean>();
  subscriptions: Record<string, Set<WebSocket>> = {};
  checkingConnectionStatuses: NodeJS.Timeout;

  public constructor() {
    SUBSCRIBER.subscribe(SocketResponseKind.SuccessResponse, (message) =>
      this.sendSuccessResponse(JSON.parse(message))
    );
    SUBSCRIBER.subscribe(SocketResponseKind.ErrorResponse, (message) =>
      this.sendErrorResponse(JSON.parse(message))
    );

    this.server.on("connection", this.handleConnection.bind(this));

    this.checkingConnectionStatuses = this.checkConnectionStatuses();
  }

  public async handleUpgrade(request: Request, socket: Duplex, head: Buffer) {
    const client = await validateTicket(request);

    if (!client) {
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

      PUBLISHER.publish(sourcedSocketRequest.kind, JSON.stringify(message));
    } catch (error) {
      SOCKETS_LOGGER.error({ error }, "Failed to handle a client message.");
    }
  }

  private sendSocketMessage<T extends object>(clientId: number, message: T) {
    const websocketEntry = [...this.clients.entries()].find(
      (entry) => entry[1].id === clientId
    );

    if (websocketEntry) {
      const [websocket] = websocketEntry;

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

  private broadcastSocketMessage<T extends object>(message: T) {
    for (const websocket of this.clients.keys()) {
      if (websocket.readyState === websocket.OPEN) {
        websocket.send(JSON.stringify(message));
      }
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
