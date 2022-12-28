import * as config from "config";
import { createClient } from "redis";

export const REDIS = createClient({
  url: config.REDIS_CONNECTION_STRING,
});

export let CACHE_INITIALIZED = false;

export function initializeCache() {
  if (CACHE_INITIALIZED) {
    return Promise.resolve();
  } else {
    CACHE_INITIALIZED = true;
    return REDIS.connect();
  }
}
