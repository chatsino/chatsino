import bodyParser from "body-parser";
import * as config from "config";
import cookieParser from "cookie-parser";
import express, { Express, Router } from "express";
import { readFileSync } from "fs";
import { createServer } from "https";
import { createLogger } from "logger";
import * as managers from "managers";
import * as middleware from "middleware";
import path from "path";
import {
  initializeCache,
  initializeDatabase,
  waitForDatabaseAndCache,
} from "persistence";
import * as routes from "routes";
import { handleUpgrade, initializeSocketServer } from "sockets";

const SERVER_LOGGER = createLogger("Server");

export async function startServer() {
  SERVER_LOGGER.info({ version: config.VERSION }, "Chatsino started up.");

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
  const server = createServer(
    {
      cert: readFileSync(config.SSL_CERTIFICATE_PATH),
      key: readFileSync(config.SSL_KEY_PATH),
    },
    app
  );

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
  // In development environments, the developer is running a local server.
  // In test and production environments, the server serves a static build.
  if (process.env.NODE_ENV !== "development") {
    app.use(express.static(path.join(__dirname, "..", "public")));
  }

  return app.use(
    bodyParser.json(),
    cookieParser(config.COOKIE_SECRET),
    middleware.requestLoggingMiddleware,
    middleware.clientSettingMiddleware
  );
}

function applyRoutes(app: Express) {
  const api = Router();

  api.use(middleware.cacheCheckingMiddleware);
  api.use("/admin", routes.createAdminRouter());
  api.use("/auth", routes.createAuthRouter());

  return app.use("/api", api);
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
