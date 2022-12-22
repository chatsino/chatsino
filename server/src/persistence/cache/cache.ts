import * as config from "config";
import { ClientSocketRequests } from "enums";
import { now } from "helpers";
import JWTRedis from "jwt-redis";
import { createLogger } from "logger";
import { handleClientTokenExpired } from "managers";
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
export const PUBLISHER = REDIS.duplicate();
export const SUBSCRIBER = REDIS.duplicate();

export let JWT_REDIS: null | JWTRedis = null;
export let CACHE_CONNECTION_STATUS: CacheConnectionStatus = "off";

export async function initializeCache() {
  if (CACHE_CONNECTION_STATUS === "off") {
    CACHE_CONNECTION_STATUS = "connecting";

    REDIS.on("connect", handleRedisConnection);
    REDIS.on("reconnecting", handleRedisReconnecting);
    REDIS.on("error", handleRedisError);
    REDIS.on("ready", handleRedisReady);

    // Pub/Sub are duplicates so their errors will be handled from `redis`
    PUBLISHER.on("error", ignoreError);
    SUBSCRIBER.on("error", ignoreError);

    await REDIS.connect();
    await PUBLISHER.connect();
    await SUBSCRIBER.connect();

    JWT_REDIS = new JWTRedis(REDIS as any);
    CACHE_CONNECTION_STATUS = "connected";
  }
}

export async function getCachedValue(key: string): Promise<unknown> {
  ensureCacheConnected();

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
  ensureCacheConnected();
  const options = ttl ? { EXAT: now() + ttl } : {};
  return REDIS.set(key, value, options);
}

export async function clearCachedValue(key: string) {
  ensureCacheConnected();
  return REDIS.del(key);
}

export function ensureCacheConnected() {
  if (CACHE_CONNECTION_STATUS !== "connected") {
    throw new CacheNotConnectedError();
  }
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

export function handleRedisReady() {
  CACHE_LOGGER.info("Ready -- subscribing to expired keys.");
  REDIS.configSet("notify-keyspace-events", "Ex");
  SUBSCRIBER.subscribe("__keyevent@0__:expired", handleKeyExpired);
}

export function ignoreError() {}

export function isCacheHealthy() {
  return !["off", "error", "reconnecting"].includes(CACHE_CONNECTION_STATUS);
}

export async function handleKeyExpired(key: string) {
  const split = key.split("/");

  if (key.startsWith(config.TOKEN_CACHE_KEY) && split.length === 3) {
    const [_, __, username] = split;

    if (username) {
      CACHE_LOGGER.info({ username }, "Token expired.");

      handleClientTokenExpired({
        from: {
          id: 0,
        },
        kind: ClientSocketRequests.ClientTokenExpired,
        args: {
          username,
        },
      });
    }
  }
}

export function hashmapGet(...args: Parameters<typeof REDIS.hGet>) {
  ensureCacheConnected();
  return REDIS.hGet(...args);
}

export function hashmapGetAll(...args: Parameters<typeof REDIS.hGetAll>) {
  ensureCacheConnected();
  return REDIS.hGetAll(...args);
}

export function hashmapSet(...args: Parameters<typeof REDIS.hSet>) {
  ensureCacheConnected();
  return REDIS.hSet(...args);
}

export function hashmapSetObject(
  key: string,
  object: Record<string, string | number>
) {
  return hashmapSet(key, Object.entries(object).flat());
}

export function entryExists(key: string) {
  ensureCacheConnected();
  return REDIS.exists(key);
}

export function increment(key: string) {
  ensureCacheConnected();
  return REDIS.incr(key);
}

export function hashIncrementBy(...args: Parameters<typeof REDIS.hIncrBy>) {
  ensureCacheConnected();
  return REDIS.hIncrBy(...args);
}

export function decrement(key: string) {
  ensureCacheConnected();
  return REDIS.decr(key);
}

export function hashDecrementBy(...args: Parameters<typeof REDIS.hIncrBy>) {
  args[2] = -args[2];
  return hashIncrementBy(...args);
}

export function setAdd(...args: Parameters<typeof REDIS.sAdd>) {
  ensureCacheConnected();
  return REDIS.sAdd(...args);
}

export function setRemove(...args: Parameters<typeof REDIS.sRem>) {
  ensureCacheConnected();
  return REDIS.sRem(...args);
}

export function getSetMembers(...args: Parameters<typeof REDIS.sMembers>) {
  ensureCacheConnected();
  return REDIS.sMembers(...args);
}

export class CacheNotConnectedError extends Error {}
