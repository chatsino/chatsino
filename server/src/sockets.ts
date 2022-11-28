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

export const WEBSOCKET_SERVER = new WebSocketServer({ noServer: true });
export const WEBSOCKET_TO_CLIENT_MAP = new Map<WebSocket, Client>();
export const WEBSOCKET_TO_ALIVE_MAP = new Map<WebSocket, boolean>();

export function initializeSocketServer() {
  WEBSOCKET_SERVER.on("connection", handleConnection);

  SUBSCRIBER.subscribe(SocketResponseKind.SuccessResponse, (message) =>
    sendSuccessSocketResponse(JSON.parse(message))
  );
  SUBSCRIBER.subscribe(SocketResponseKind.ErrorResponse, (message) =>
    sendErrorSocketResponse(JSON.parse(message))
  );
}

export async function createSocket(
  request: Request,
  socket: Duplex,
  head: Buffer,
  client: Client
) {
  const websocket = await new Promise<WebSocket>((resolve) =>
    WEBSOCKET_SERVER.handleUpgrade(request, socket, head, resolve)
  );

  WEBSOCKET_TO_CLIENT_MAP.set(websocket, client);
  WEBSOCKET_TO_ALIVE_MAP.set(websocket, true);

  return WEBSOCKET_SERVER.emit("connection", websocket);
}

// #region Incoming
export async function handleUpgrade(
  request: Request,
  socket: Duplex,
  head: Buffer
) {
  const client = await validateTicket(request);

  if (!client) {
    SOCKETS_LOGGER.info(
      "Unable to validate ticket: denying connection attempt."
    );
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    return socket.destroy();
  }

  return createSocket(request, socket, head, client);
}

export function handleConnection(websocket: WebSocket) {
  SOCKETS_LOGGER.info(
    {
      client: WEBSOCKET_TO_CLIENT_MAP.get(websocket),
    },
    "A client connected."
  );

  websocket.on("message", (data) => handleSocketMessage(websocket, data));
  websocket.on("pong", handlePong);
  websocket.on("close", handleClose);
}

export function handleClose(websocket: WebSocket) {
  SOCKETS_LOGGER.info(
    {
      client: WEBSOCKET_TO_CLIENT_MAP.get(websocket),
    },
    "A client disconnected."
  );

  WEBSOCKET_TO_CLIENT_MAP.delete(websocket);
  WEBSOCKET_TO_ALIVE_MAP.delete(websocket);
}

export function handlePong(websocket: WebSocket) {
  WEBSOCKET_TO_ALIVE_MAP.set(websocket, true);
}

export async function handleSocketMessage(websocket: WebSocket, data: RawData) {
  try {
    const message = JSON.parse(data.toString());
    const client = WEBSOCKET_TO_CLIENT_MAP.get(websocket);

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
// #endregion

// #region Outgoing
export function sendSocketMessage<T extends object>(
  clientId: number,
  message: T
) {
  const websocketEntry = [...WEBSOCKET_TO_CLIENT_MAP.entries()].find(
    (entry) => entry[1].id === clientId
  );

  if (websocketEntry) {
    const [websocket] = websocketEntry;

    if (websocket.readyState === websocket.OPEN) {
      websocket.send(JSON.stringify(message));
    }
  }
}

export async function sendSuccessSocketResponse({
  to,
  kind,
  data,
}: SocketSuccessResponse) {
  try {
    await socketSuccessResponseSchema.validate({ to, kind, data });

    return sendSocketMessage(to, {
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

export async function sendErrorSocketResponse({
  to,
  kind,
  error,
}: SocketErrorResponse) {
  try {
    await socketErrorResponseSchema.validate({ to, kind, error });

    return sendSocketMessage(to, {
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

export function broadcastSocketMessage<T extends object>(message: T) {
  for (const websocket of WEBSOCKET_TO_CLIENT_MAP.keys()) {
    if (websocket.readyState === websocket.OPEN) {
      websocket.send(JSON.stringify(message));
    }
  }
}
// #endregion

// #region Checking connections are still alive.
export let checkingConnectionStatuses = checkConnectionStatuses();

export function checkConnectionStatuses() {
  return setTimeout(() => {
    SOCKETS_LOGGER.info("Checking connection statuses.");

    const { clients } = WEBSOCKET_SERVER;

    if (clients.size > 0) {
      let terminatedConnections = 0;

      for (const websocket of clients) {
        if (WEBSOCKET_TO_ALIVE_MAP.get(websocket)) {
          WEBSOCKET_TO_ALIVE_MAP.set(websocket, false);
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

      checkingConnectionStatuses = checkConnectionStatuses();
    }
  }, config.CONNECTION_STATUS_CHECK_RATE_MS);
}
// #endregion

export class CannotVerifyMessageError extends Error {}
