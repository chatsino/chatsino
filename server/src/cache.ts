import * as config from "config";
import { createLogger, now } from "helpers";
import { createClient } from "redis";

export type CacheConnectionStatus =
  | "off"
  | "connecting"
  | "connected"
  | "error"
  | "reconnecting";

export const CACHE_LOGGER = createLogger(config.LOGGER_NAMES.CACHE);

export const REDIS = createClient({
  url: config.REDIS_CONNECTION_STRING,
});

export let CACHE_CONNECTION_STATUS: CacheConnectionStatus = "off";

export async function initializeCache() {
  if (CACHE_CONNECTION_STATUS === "off") {
    CACHE_CONNECTION_STATUS = "connecting";

    REDIS.on("connect", handleRedisConnection);
    REDIS.on("reconnecting", handleRedisReconnecting);
    REDIS.on("error", handleRedisError);

    await REDIS.connect();

    CACHE_CONNECTION_STATUS = "connected";
  }
}

export async function getCachedValue(key: string): Promise<unknown> {
  let value = await REDIS.get(key);

  if (value) {
    try {
      value = JSON.parse(value);
    } catch {}
  }

  return value;
}

export async function setCachedValue(
  key: string,
  value: number | string,
  ttl?: number
) {
  const options = ttl ? { EXAT: now() + ttl } : {};
  return REDIS.set(key, value, options);
}

export async function clearCachedValue(key: string) {
  return REDIS.del(key);
}

export function handleRedisConnection() {
  if (CACHE_CONNECTION_STATUS !== "connected") {
    CACHE_LOGGER.info("Connected.");
    CACHE_CONNECTION_STATUS = "connected";
  }
}

export function handleRedisReconnecting() {
  if (CACHE_CONNECTION_STATUS !== "reconnecting") {
    CACHE_CONNECTION_STATUS = "reconnecting";
    CACHE_LOGGER.info("Reconnecting...");
  }
}

export function handleRedisError(error: unknown) {
  if (CACHE_CONNECTION_STATUS === "connected") {
    CACHE_CONNECTION_STATUS = "error";
    CACHE_LOGGER.error({ error }, "Error.");
  }
}
