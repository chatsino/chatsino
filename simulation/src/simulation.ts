import * as config from "config";
import {
  CombinedRequests,
  RoomSocketRequests,
  UserSocketRequests,
} from "enums";
import { createLogger, sleep } from "helpers";
import { WebSocket } from "ws";

export const SIMULATION_LOGGER = createLogger(config.LOGGER_NAMES.SIMULATION);

export async function startSimulation() {
  SIMULATION_LOGGER.info("Starting up.");

  const apiSocket = new WebSocket(config.API_CONNECTION_STRING);

  await new Promise<void>((resolve) => {
    apiSocket.on("open", () => {
      SIMULATION_LOGGER.info(
        "Socket connection to Chatsino-Server established."
      );
      resolve();
    });
    apiSocket.on("close", () => {
      SIMULATION_LOGGER.info(
        "Socket connection to Chatsino-Server terminated."
      );
    });
    apiSocket.on("error", () => {
      SIMULATION_LOGGER.info(
        "Socket connection to Chatsino-Server experienced an error."
      );
    });
  });

  apiSocket.on("message", async (message) => {
    try {
      const { kind, data } = JSON.parse(message.toString()) as {
        kind: CombinedRequests;
        data: Record<string, unknown>;
      };

      SIMULATION_LOGGER.info({ kind, data }, "Received a socket message.");
    } catch (error) {
      SIMULATION_LOGGER.error(
        { error: error.message },
        "Unable to handle socket message."
      );
    }
  });

  await sleep(100);

  apiSocket.send(
    JSON.stringify({
      kind: UserSocketRequests.GetAllUsers,
    })
  );
  apiSocket.send(
    JSON.stringify({
      kind: RoomSocketRequests.AllPublicRooms,
    })
  );
}
