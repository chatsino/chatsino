import * as config from "config";
import express from "express";
import { createServer } from "http";
import { createLogger } from "logger";
import { WebSocket, WebSocketServer } from "ws";

const SERVER_LOGGER = createLogger(config.LOGGER_NAMES.SERVER);

SERVER_LOGGER.info(
  { environment: process.env.NODE_ENV, version: config.VERSION },
  "Model server starting up."
);

SERVER_LOGGER.info("Initializing app.");
const app = express();
const server = createServer(app);
const socketServer = new WebSocketServer({ noServer: true });
const heartbeats = new Map<WebSocket, boolean>();
const heartbeat = (websocket: WebSocket) => heartbeats.set(websocket, true);
const sendMessage = <T extends { kind: string }>(
  websocket: WebSocket,
  data: T
) => websocket.send(JSON.stringify(data));

socketServer.on("connection", (websocket) => {
  SERVER_LOGGER.info("A server has opened a WebSocket connection.");

  websocket.on("pong", () => heartbeat(websocket));
  websocket.on("close", () => {
    SERVER_LOGGER.info("Terminated a WebSocket connection.");
  });
  websocket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      SERVER_LOGGER.info({ message }, "Received a message from a client.");
    } catch (error) {
      SERVER_LOGGER.info({ error }, "Error parsing received message.");
    }
  });

  sendMessage(websocket, {
    kind: "info",
    message: "Connection established.",
  });
});

server.on("upgrade", async (request, socket, head) => {
  const websocket = await new Promise<WebSocket>((resolve) =>
    socketServer.handleUpgrade(request, socket, head, resolve)
  );

  heartbeats.set(websocket, true);

  return socketServer.emit("connection", websocket);
});

// Check for disonnected clients every so often.
setInterval(() => {
  for (const client of socketServer.clients) {
    if (heartbeats.get(client)) {
      heartbeats.set(client, false);
      client.ping();
    } else {
      SERVER_LOGGER.info({ client }, "Terminating expired connection.");
      client.terminate();
    }
  }
}, config.CONNECTION_STATUS_CHECK_RATE_MS);

server.listen(config.PORT, () =>
  SERVER_LOGGER.info(`Model server listening on port ${config.PORT}.`)
);
