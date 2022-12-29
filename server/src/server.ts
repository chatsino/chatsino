import bodyParser from "body-parser";
import * as config from "config";
import cookieParser from "cookie-parser";
import express, { Express, Router } from "express";
import fileUpload from "express-fileupload";
import { sleep } from "helpers";
import { createServer } from "http";
import { createLogger } from "logger";
import * as managers from "managers";
import * as middleware from "middleware";
import {
  initializeCache,
  initializeDatabase,
  waitForDatabaseAndCache,
} from "persistence";
import * as routes from "routes";
import { SocketServer } from "socket-server";
import { WebSocket } from "ws";

export const SERVER_LOGGER = createLogger(config.LOGGER_NAMES.SERVER);

export async function startServer() {
  SERVER_LOGGER.info(
    { environment: process.env.NODE_ENV, version: config.VERSION },
    "Chatsino-Server started up."
  );

  SERVER_LOGGER.info(
    {
      database: { host: config.POSTGRES_HOST, port: config.POSTGRES_PORT },
      cache: { host: config.REDIS_HOST, port: config.REDIS_PORT },
    },
    "Waiting for database and cache."
  );
  await waitForDatabaseAndCache();

  SERVER_LOGGER.info("Initializing postgres.");
  await initializeDatabase();

  SERVER_LOGGER.info("Initializing redis.");
  await initializeCache();

  SERVER_LOGGER.info("Initializing app.");
  const app = express();
  applyMiddleware(app);
  applyRoutes(app);

  SERVER_LOGGER.info("Initializing HTTPS and WebSocket servers.");
  const server = createServer(app);
  const socketServer = new SocketServer();
  server.on("upgrade", socketServer.handleUpgrade.bind(socketServer));

  SERVER_LOGGER.info("Initializing feature managers.");
  initializeFeatureManagers();

  if (process.env.NODE_ENV === "production") {
    SERVER_LOGGER.info("Handling uncaught exceptions and rejections.");
    handleUncaughtExceptionsAndRejections();
  }

  SERVER_LOGGER.info("Initializing socket connection to chatsino-models.");
  initializeModelSocket();

  server.listen(config.PORT, () =>
    SERVER_LOGGER.info(`Server listening on port ${config.PORT}.`)
  );
}

// #region Helpers
function applyMiddleware(app: Express) {
  return app.use(
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
    cookieParser(config.COOKIE_SECRET),
    fileUpload(),
    middleware.clientSettingMiddleware,
    middleware.requestLoggingMiddleware,
    middleware.cacheCheckingMiddleware
  );
}

function applyRoutes(app: Express) {
  const api = Router();

  api.use("/admin", routes.createAdminRouter());
  api.use("/auth", routes.createAuthRouter());
  api.use("/chat", routes.createChatRouter());
  api.use("/users", routes.createUserRouter());

  return app.use("/api", api);
}

function initializeFeatureManagers() {
  managers.initializeBlackjackManager();
  managers.initializeChatroomManager();
}

function initializeModelSocket() {
  let fibonacciRolloffIndex = 0;

  const initialize = () => {
    let modelSocket = new WebSocket(config.MODELS_CONNECTION_STRING);

    modelSocket.on("open", () => {
      SERVER_LOGGER.info("Socket connection to chatsino-models established.");

      fibonacciRolloffIndex = 0;
    });
    modelSocket.on("close", async () => {
      SERVER_LOGGER.info("Socket connection to chatsino-models terminated.");

      const duration =
        config.MODELS_RECONNECT_ATTEMPT_RATES_MS[fibonacciRolloffIndex++] ??
        config.MODELS_RECONNECT_ATTEMPT_RATES_MS[
          config.MODELS_RECONNECT_ATTEMPT_RATES_MS.length - 1
        ];

      await sleep(duration);

      SERVER_LOGGER.info(
        { attempt: fibonacciRolloffIndex },
        "Attempting to reconnect to chatsino-models."
      );

      initialize();
    });
    modelSocket.on("error", () => {
      SERVER_LOGGER.error(
        "Socket connection to chatsino-models experienced an error."
      );
    });
    modelSocket.on("message", (event) => {
      try {
        const message = JSON.parse(event.toString()) as { kind: string };

        SERVER_LOGGER.info(
          { message },
          "Received a socket message from chatsino-models."
        );
      } catch (error) {
        SERVER_LOGGER.error(
          { error },
          "Socket connection to chatsino-models experienced an error."
        );
      }
    });
  };

  initialize();
}

function handleUncaughtExceptionsAndRejections() {
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
        "Chatsino-Server is shutting down. Goodbye!"
      );
    });
}
// #endregion
