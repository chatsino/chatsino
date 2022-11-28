import path from "path";

// App
export const VERSION = process.env.VERSION;
export const PORT = process.env.PORT;

// Secrets
export const JWT_SECRET = process.env.JWT_SECRET ?? "";
export const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "";
export const TICKET_SECRET = process.env.TICKET_SECRET ?? "";

// SSL
export const SSL_KEY_PATH = path.join(
  __dirname,
  "..",
  ".ssh",
  "localhost-key.pem"
);
export const SSL_CERTIFICATE_PATH = path.join(
  __dirname,
  "..",
  ".ssh",
  "localhost.pem"
);

// Postgres
export const POSTGRES_HOST = process.env.POSTGRES_HOST;
export const POSTGRES_PORT = 5432;
export const POSTGRES_CONNECTION_STRING =
  process.env.POSTGRES_CONNECTION_STRING ?? "";

// Redis
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = 6379;
export const REDIS_CONNECTION_STRING =
  process.env.REDIS_CONNECTION_STRING ?? "";

// Caching
export const TICKET_CACHE_TTL_SECONDS = 10;
export const CLIENT_CACHE_TTL_SECONDS = 60 * 3;

// Sockets
export const CONNECTION_STATUS_CHECK_RATE_MS = 1000 * 30;

// Auth
export const MINIMUM_PASSWORD_SIZE = 8;
export const PASSWORD_SALT_SIZE = 128;
export const PASSWORD_HASH_SIZE = 60;
export const JWT_ACCESS_EXPIRATON_TIME_SECONDS = 60 * 20;
