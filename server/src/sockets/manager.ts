import * as config from "config";
import { Request } from "express";
import { publisher } from "persistence";
import { SafeClient, socketMessageSchema } from "schemas";
import { Duplex } from "stream";
import { RawData, WebSocket, WebSocketServer } from "ws";
import { SOCKETS_LOGGER } from "./common";

export const WEBSOCKET_SERVER = new WebSocketServer({ noServer: true });
export const WEBSOCKET_TO_CLIENT_MAP = new Map<WebSocket, SafeClient>();
export const WEBSOCKET_TO_ALIVE_MAP = new Map<WebSocket, boolean>();
export const CLIENT_MESSAGE_CHANNEL = "client-message";

WEBSOCKET_SERVER.on("connection", handleConnection);

export let checkingConnectionStatuses = checkConnectionStatuses();

export async function createWebSocket(
  request: Request,
  socket: Duplex,
  head: Buffer,
  client: SafeClient
) {
  SOCKETS_LOGGER.info({ client }, "Creating a websocket.");

  const websocket = await new Promise<WebSocket>((resolve) =>
    WEBSOCKET_SERVER.handleUpgrade(request, socket, head, resolve)
  );

  WEBSOCKET_TO_CLIENT_MAP.set(websocket, client);
  WEBSOCKET_TO_ALIVE_MAP.set(websocket, true);

  return WEBSOCKET_SERVER.emit("connection", websocket, request);
}

export function handleConnection(websocket: WebSocket) {
  SOCKETS_LOGGER.info("New connection established.");
  websocket.on("message", handleMessage);
  websocket.on("pong", handlePong);
  websocket.on("close", handleClose);
}

export function handleClose(websocket: WebSocket) {
  SOCKETS_LOGGER.info("A client disconnected.");
  WEBSOCKET_TO_CLIENT_MAP.delete(websocket);
  WEBSOCKET_TO_ALIVE_MAP.delete(websocket);
}

export function handlePong(websocket: WebSocket) {
  WEBSOCKET_TO_ALIVE_MAP.set(websocket, true);
}

export async function handleMessage(websocket: WebSocket, data: RawData) {
  const client = WEBSOCKET_TO_CLIENT_MAP.get(websocket);

  if (!client) {
    throw new CannotVerifyMessageError();
  }

  const message = JSON.parse(data.toString());

  await socketMessageSchema.validate(message);

  publisher.publish(
    CLIENT_MESSAGE_CHANNEL,
    JSON.stringify({
      ...message,
      from: client,
    })
  );
}

export function checkConnectionStatuses() {
  return setTimeout(() => {
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

export class CannotVerifyMessageError extends Error {}
