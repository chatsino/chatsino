import * as config from "config";
import { now } from "helpers";
import JWTRedis from "jwt-redis";
import { createClient } from "redis";

export const [redis, publisher, subscriber] = Array.from({ length: 3 }, () =>
  createClient({
    url: config.REDIS_CONNECTION_STRING,
  })
);

export let jwtRedis: null | JWTRedis = null;
let initialized = false;

export async function initializeRedis() {
  if (!initialized) {
    for (const client of [redis, publisher, subscriber]) {
      await client.connect();
    }

    jwtRedis = new JWTRedis(redis as any);
    initialized = true;
  }
}

export async function getCachedValue(key: string): Promise<unknown> {
  ensureRedisInitialized();

  let value = await redis.get(key);

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
  ensureRedisInitialized();
  return redis.set(key, value, { EXAT: now() + ttl });
}

export async function clearCachedValue(key: string) {
  ensureRedisInitialized();
  return redis.del(key);
}

export function ensureRedisInitialized() {
  if (!initialized || !jwtRedis) {
    throw new RedisNotInitializedError();
  }
}

export function handleRedisError(error: unknown) {
  console.error({ error });
}

export class RedisNotInitializedError extends Error {}
