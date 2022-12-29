import * as config from "config";
import express from "express";
import { createServer, Server } from "http";
import { createLogger, guid } from "helpers";
import { WebSocket, WebSocketServer } from "ws";
import { buildSearchIndices, SUBSCRIBER } from "cache";
import { CommonHandlerRequests, handleRequest } from "handlers/common";

export const SERVER_LOGGER = createLogger(config.LOGGER_NAMES.SERVER);

export async function startServer() {
  SERVER_LOGGER.info(
    { environment: process.env.NODE_ENV, version: config.VERSION },
    "Chatsino-Models starting up."
  );

  await buildSearchIndices();

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
  const clients = {
    toId: new Map<WebSocket, string>(),
    toWebSocket: new Map<string, WebSocket>(),
  };
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

      const id = clients.toId.get(websocket) as string;
      clients.toId.delete(websocket);
      clients.toWebSocket.delete(id);

      heartbeats.delete(websocket);
    });
    websocket.on("message", (data) => {
      try {
        const text = data.toString();
        const message = JSON.parse(text) as {
          userId: string;
          kind: string;
          args?: Record<string, unknown>;
        };

        if (!message.userId) {
          throw new Error("Received message is missing userId.");
        }

        if (!message.kind) {
          throw new Error("Received message is missing a handler kind.");
        }

        message.args = message.args ?? {};

        return handleRequest(
          clients.toId.get(websocket) as string,
          message.userId,
          message.kind,
          message.args
        );
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

    const id = guid();
    clients.toId.set(websocket, id);
    clients.toWebSocket.set(id, websocket);

    heartbeats.set(websocket, true);

    return socketServer.emit("connection", websocket);
  });

  let checkingForDisconnectedClients: NodeJS.Timeout;

  checkingForDisconnectedClients = setTimeout(
    checkForDisconnectedClients,
    config.CONNECTION_STATUS_CHECK_RATE_MS
  );

  SUBSCRIBER.on(CommonHandlerRequests.Response, (message) => {
    const { socketId, kind, result } = JSON.parse(message) as {
      socketId: string;
      kind: string;
      result: unknown;
    };

    const websocket = clients.toWebSocket.get(socketId);

    if (websocket) {
      websocket.send(JSON.stringify({ kind, result }));
    }
  });
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
