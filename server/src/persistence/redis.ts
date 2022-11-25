import { createClient } from "redis";

export const publisher = createClient();
export const subscriber = publisher.duplicate();

let initialized = false;

export async function initializeRedis() {
  if (!initialized) {
    await publisher.connect();
    initialized = true;
  }
}

export async function getCachedValue<T>(key: string): Promise<null | T> {
  ensureRedisInitialized();
  return {} as T;
}

export async function setCachedValue(key: string, value: unknown) {
  ensureRedisInitialized();
}

export async function clearCachedValue(key: string) {
  ensureRedisInitialized();
}

export function ensureRedisInitialized() {
  if (!initialized) {
    throw new RedisNotInitializedError();
  }
}

export class RedisNotInitializedError extends Error {}
