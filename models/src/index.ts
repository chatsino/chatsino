import * as config from "config";
import express from "express";
import { createServer } from "http";
import { createLogger } from "logger";

const SERVER_LOGGER = createLogger(config.LOGGER_NAMES.SERVER);

SERVER_LOGGER.info(
  { environment: process.env.NODE_ENV, version: config.VERSION },
  "Model server starting up."
);

SERVER_LOGGER.info("Initializing app.");
const app = express();
const server = createServer(app);

server.listen(config.PORT, () =>
  SERVER_LOGGER.info(`Model server listening on port ${config.PORT}.`)
);
