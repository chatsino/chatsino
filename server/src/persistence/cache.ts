import * as config from "config";
import { now } from "helpers";
import JWTRedis from "jwt-redis";
import { createLogger } from "logger";
import { createClient } from "redis";

export type CacheConnectionStatus =
  | "off"
  | "connecting"
  | "connected"
  | "error"
  | "reconnecting";

export const CACHE_LOGGER = createLogger("Cache");

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
  ttl: number
) {
  ensureCacheConnected();
  return REDIS.set(key, value, { EXAT: now() + ttl });
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
    CACHE_CONNECTION_STATUS = "connected";
    CACHE_LOGGER.info("Connected.");
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

export function ignoreError() {}

export function isCacheHealthy() {
  return !["off", "error", "reconnecting"].includes(CACHE_CONNECTION_STATUS);
}

export class CacheNotConnectedError extends Error {}
