import * as config from "config";
import express from "express";
import { createLogger } from "helpers";
import { createServer } from "http";
import { startSimulation } from "simulation";

export const SERVER_LOGGER = createLogger(config.LOGGER_NAMES.SERVER);

export async function startServer() {
  SERVER_LOGGER.info(
    { environment: process.env.NODE_ENV, version: config.VERSION },
    "Chatsino-Simulation starting up."
  );

  SERVER_LOGGER.info("Initializing app.");
  const app = express();
  const server = createServer(app);

  SERVER_LOGGER.info("Connecting to Chatsino-Server.");
  await startSimulation();

  server.listen(config.PORT, () =>
    SERVER_LOGGER.info(`Chatsino-Simulation listening on port ${config.PORT}.`)
  );
}
