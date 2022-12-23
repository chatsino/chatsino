import * as config from "config";
import { createLogger } from "logger";
import { Client } from "redis-om";

export const OBJECT_MAPPER_LOGGER = createLogger(
  config.LOGGER_NAMES.OBJECT_MAPPER
);

export async function startClient() {
  try {
    const client = new Client();

    await client.open(config.REDIS_CONNECTION_STRING);

    OBJECT_MAPPER_LOGGER.info("Connected.");

    return client;
  } catch (error) {
    OBJECT_MAPPER_LOGGER.error({ error }, "Error.");
    throw error;
  }
}

export async function executeCommand(
  command: (client: Client) => Promise<unknown>
) {
  try {
    const client = await startClient();
    const result = await command(client);

    await client.close();

    return result;
  } catch (error) {
    OBJECT_MAPPER_LOGGER.error(
      { error, message: error.message ?? "none", command },
      "Unable to execute command."
    );

    throw error;
  }
}
