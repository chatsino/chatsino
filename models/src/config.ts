export const VERSION = process.env.VERSION;

export const PORT = process.env.PORT;

export const CONNECTION_STATUS_CHECK_RATE_MS = 1000;

export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = 6379;
export const REDIS_CONNECTION_STRING =
  process.env.REDIS_CONNECTION_STRING ?? "";

export enum LOGGER_NAMES {
  OBJECT_MAPPER = "Object Mapper",
  SERVER = "Server",
}
