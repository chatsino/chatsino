import * as config from "config";
import express from "express";
import { createServer, Server } from "http";
import { createLogger } from "logger";
import { WebSocket, WebSocketServer } from "ws";

export const SERVER_LOGGER = createLogger(config.LOGGER_NAMES.SERVER);

export function startServer() {
  SERVER_LOGGER.info(
    { environment: process.env.NODE_ENV, version: config.VERSION },
    "Model server starting up."
  );

  SERVER_LOGGER.info("Initializing app.");
  const app = express();
  const server = createServer(app);

  SERVER_LOGGER.info("Initializing socket server.");
  initializeSocketServer(server);

  if (process.env.NODE_ENV === "production") {
    SERVER_LOGGER.info("Handling uncaught exceptions and rejections.");
    handleUncaughtExceptionsAndRejections();
  }

  server.listen(config.PORT, () =>
    SERVER_LOGGER.info(`Model server listening on port ${config.PORT}.`)
  );
}

// #region Helpers

export function initializeSocketServer(server: Server) {
  const socketServer = new WebSocketServer({ noServer: true });
  const heartbeats = new Map<WebSocket, boolean>();
  const heartbeat = (websocket: WebSocket) => heartbeats.set(websocket, true);
  const sendMessage = <T extends { kind: string }>(
    websocket: WebSocket,
    data: T
  ) => websocket.send(JSON.stringify(data));
  const checkForDisconnectedClients = () => {
    for (const client of socketServer.clients) {
      if (heartbeats.get(client)) {
        heartbeats.set(client, false);
        client.ping();
      } else {
        SERVER_LOGGER.info({ client }, "Terminating expired connection.");
        client.terminate();
      }
    }

    checkingForDisconnectedClients = setTimeout(
      checkForDisconnectedClients,
      config.CONNECTION_STATUS_CHECK_RATE_MS
    );
  };

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

  let checkingForDisconnectedClients = setTimeout(
    checkForDisconnectedClients,
    config.CONNECTION_STATUS_CHECK_RATE_MS
  );
}

export function handleUncaughtExceptionsAndRejections() {
  process
    .on("uncaughtException", (error, origin) => {
      SERVER_LOGGER.fatal({ error, origin }, "Detected an uncaught exception.");
      process.exit(1);
    })
    .on("unhandledRejection", (error, origin) => {
      SERVER_LOGGER.fatal(
        { error, origin },
        "Detected an unhandled rejection."
      );
      process.exit(1);
    })
    .on("exit", (exitCode) => {
      SERVER_LOGGER.info(
        { exitCode },
        "Chatsino-Models is shutting down. Goodbye!"
      );
    });
}
// #endregion