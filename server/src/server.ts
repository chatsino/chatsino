import bodyParser from "body-parser";
import * as config from "config";
import cookieParser from "cookie-parser";
import express, { Express, Router } from "express";
import { readFileSync } from "fs";
import { createServer } from "https";
import { createLogger } from "logger";
import * as managers from "managers";
import * as middleware from "middleware";
import * as models from "models";
import path from "path";
import { initializeRedis } from "persistence";
import * as routes from "routes";
import { handleUpgrade } from "sockets";
import waitPort from "wait-port";

const SERVER_LOGGER = createLogger("Server");

export async function startServer() {
  SERVER_LOGGER.info({ version: config.VERSION }, "Chatsino started up.");

  SERVER_LOGGER.info("Waiting for database and cache.");
  await waitForDatabaseAndCache();
  SERVER_LOGGER.info("Database and cache are available.");

  SERVER_LOGGER.info("Initializing postgres.");
  await initializePostgres();

  SERVER_LOGGER.info("Initializing redis.");
  await initializeRedis();

  SERVER_LOGGER.info("Initializing app.");
  const app = express();

  SERVER_LOGGER.info("Applying middleware and routes.");
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
  server.on("upgrade", handleUpgrade);

  SERVER_LOGGER.info("Initializing feature managers.");
  initializeFeatureManagers();

  SERVER_LOGGER.info("Handling uncaught exceptions and rejections.");
  handleUncaughtExceptionsAndRejections();

  server.listen(config.PORT, () =>
    SERVER_LOGGER.info(`Server listening on port ${config.PORT}.`)
  );
}

// #region Helpers
async function waitForDatabaseAndCache() {
  try {
    await Promise.all([
      waitPort({
        host: config.POSTGRES_HOST,
        port: config.POSTGRES_PORT,
        output: "silent",
      }),
      waitPort({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        output: "silent",
      }),
    ]);
  } catch (error) {
    if (error instanceof Error) {
      SERVER_LOGGER.fatal(
        { error },
        "An error occurred while waiting for database and cache."
      );

      process.exit(1);
    }
  }
}

function initializePostgres() {
  return Promise.all([models.createClientTable()]);
}

function applyMiddleware(app: Express) {
  return app.use(
    express.static(path.join(__dirname, "..", "public")),
    bodyParser.json(),
    cookieParser(config.COOKIE_SECRET),
    middleware.clientSettingMiddleware,
    middleware.requestLoggingMiddleware
  );
}

function applyRoutes(app: Express) {
  const api = Router();

  api.use("/admin", routes.createAdminRouter());
  api.use("/auth", routes.createAuthRouter());

  return app.use("/api", api);
}

function initializeFeatureManagers() {
  managers.initializeSocketManager();
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
