import bodyParser from "body-parser";
import * as config from "config";
import cookieParser from "cookie-parser";
import express, { Express, Router } from "express";
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
import { handleUpgrade, initializeSocketServer } from "sockets";

const SERVER_LOGGER = createLogger("Server");

export async function startServer() {
  SERVER_LOGGER.info(
    { environment: process.env.NODE_ENV, version: config.VERSION },
    "Chatsino started up."
  );

  SERVER_LOGGER.info("Waiting for database and cache.");
  await waitForDatabaseAndCache();
  SERVER_LOGGER.info("Database and cache are available.");

  SERVER_LOGGER.info("Initializing postgres.");
  await initializeDatabase();

  SERVER_LOGGER.info("Initializing redis.");
  await initializeCache();

  SERVER_LOGGER.info("Initializing app.");
  const app = express();
  applyMiddleware(app);
  applyRoutes(app);

  SERVER_LOGGER.info("Initializing server.");
  const server = createServer(app);

  SERVER_LOGGER.info("Adding websocket capabilities.");
  initializeSocketServer();
  server.on("upgrade", handleUpgrade);

  SERVER_LOGGER.info("Initializing feature managers.");
  initializeFeatureManagers();

  if (process.env.NODE_ENV === "production") {
    SERVER_LOGGER.info("Handling uncaught exceptions and rejections.");
    handleUncaughtExceptionsAndRejections();
  }

  server.listen(config.PORT, () =>
    SERVER_LOGGER.info(`Server listening on port ${config.PORT}.`)
  );
}

function applyMiddleware(app: Express) {
  return app.use(
    bodyParser.json(),
    cookieParser(config.COOKIE_SECRET),
    middleware.clientSettingMiddleware,
    middleware.requestLoggingMiddleware,
    middleware.cacheCheckingMiddleware
  );
}

function applyRoutes(app: Express) {
  app.use("/admin", routes.createAdminRouter());
  app.use("/auth", routes.createAuthRouter());
}

function initializeFeatureManagers() {
  managers.initializeBlackjackManager();
  managers.initializeChatroomManager();
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
      SERVER_LOGGER.info({ exitCode }, "Chatsino is shutting down. Goodbye!");
    });
}

// #endregion
