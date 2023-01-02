import bodyParser from "body-parser";
import * as config from "config";
import createRedisStore from "connect-redis";
import cookieParser from "cookie-parser";
import express, { Express, Router } from "express";
import fileUpload from "express-fileupload";
import session from "express-session";
import { createServer } from "http";
import { createLogger } from "logger";
import * as managers from "managers";
import * as middleware from "middleware";
import {
  initializeCache,
  initializeDatabase,
  waitForDatabaseAndCache,
} from "persistence";
import { createClient } from "redis";
import * as routes from "routes";
import { initializeSocketServer } from "sockets";

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
      models: { host: config.MODELS_HOST, port: config.MODELS_PORT },
    },
    "Waiting for database, cache and."
  );
  await waitForDatabaseAndCache();

  SERVER_LOGGER.info("Initializing postgres.");
  await initializeDatabase();

  SERVER_LOGGER.info("Initializing redis.");
  await initializeCache();

  SERVER_LOGGER.info("Initializing app.");
  const app = express();
  await applyMiddleware(app);
  applyRoutes(app);

  SERVER_LOGGER.info("Initializing HTTPS and WebSocket servers.");
  const server = createServer(app);
  initializeSocketServer(server);

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

// #region Helpers
async function applyMiddleware(app: Express) {
  const RedisStore = createRedisStore(session);
  const redisClient = createClient({
    url: config.REDIS_CONNECTION_STRING,
    legacyMode: true,
  });

  await redisClient.connect();

  return app.use(
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
    cookieParser(config.COOKIE_SECRET),
    session({
      secret: config.JWT_SECRET,
      resave: false,
      saveUninitialized: true,
      store: new RedisStore({ client: redisClient as any }),
    }),
    fileUpload(),
    middleware.requestLoggingMiddleware
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
  managers.initializeUserManager();
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
