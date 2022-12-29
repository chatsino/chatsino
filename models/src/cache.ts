import * as config from "config";
import { createClient } from "redis";
import { createLogger } from "helpers";
import { Client } from "redis-om";
import * as entities from "./entities";

export const CACHE_LOGGER = createLogger(config.LOGGER_NAMES.CACHE);

export const CACHE = createClient({
  url: config.REDIS_CONNECTION_STRING,
});
export const PUBLISHER = CACHE.duplicate();
export const SUBSCRIBER = CACHE.duplicate();

export let CACHE_INITIALIZED = false;

export function initializeCache() {
  if (CACHE_INITIALIZED) {
    return Promise.resolve();
  } else {
    CACHE_LOGGER.info("Initializing cache.");

    CACHE_INITIALIZED = true;

    return Promise.all([
      CACHE.connect(),
      PUBLISHER.connect(),
      SUBSCRIBER.connect(),
    ]);
  }
}

export async function startClient() {
  try {
    const client = new Client();

    await client.open(config.REDIS_CONNECTION_STRING);

    return client;
  } catch (error) {
    CACHE_LOGGER.error({ error }, "Error.");
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
    CACHE_LOGGER.error(
      { error, message: error.message ?? "none", command },
      "Unable to execute command."
    );

    throw error;
  }
}

export async function buildSearchIndices() {
  CACHE_LOGGER.info("Building entity search indices.");

  return Promise.all(
    [
      entities.MessageEntity,
      entities.RoomEntity,
      entities.RouletteEntity,
      entities.SniperEntity,
      entities.UserEntity,
    ].map((entity) => entity.createIndex())
  );
}
