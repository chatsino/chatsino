// General
export const VERSION = process.env.VERSION as string;
export const PORT = parseInt(process.env.PORT as string);

// Redis
export const REDIS_HOST = process.env.REDIS_HOST as string;
export const REDIS_PORT = parseInt(process.env.REDIS_PORT as string);
export const REDIS_CONNECTION_STRING = process.env
  .REDIS_CONNECTION_STRING as string;

// Secrets
export const PASSWORD_SECRET = process.env.PASSWORD_SECRET as string;
export const MINIMUM_PASSWORD_SIZE = 8;
export const PASSWORD_SALT_SIZE = 128;
export const PASSWORD_HASH_SIZE = 60;

// Timing
export const CONNECTION_STATUS_CHECK_RATE_MS = 1000;

// Logging
export enum LOGGER_NAMES {
  CACHE = "Cache",
  SERVER = "Server",
}
