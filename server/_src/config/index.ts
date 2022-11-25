import path from "path";

// Re-export all configuration shared between client and server.
export * from "../shared/config";

// Should debug functionality be enabled?
export const DEBUG = process.env.NODE_ENV !== "production";

// What year is it?
export const VERSION = process.env.VERSION;

// Ports
export const PORT = process.env.PORT;
export const POSTGRES_PORT = 5432;
export const REDIS_PORT = 6379;

// Where is the certificate and the key located?
export const SSL_CERTIFICATE_PATH = path.join(
  __dirname,
  "../.ssh/localhost.pem"
);

export const SSL_KEY_PATH = path.join(__dirname, "../.ssh/localhost-key.pem");

// What is the connection string for Postgres?
export const POSTGRES_CONNECTION_STRING =
  process.env.POSTGRES_CONNECTION_STRING ?? "";

// Seeeeeeekrits
export const JWT_SECRET = process.env.JWT_SECRET ?? "";
export const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "";
export const TICKET_SECRET = process.env.TICKET_SECRET ?? "";

// Hashing & Salting
export const SALT_SIZE = 128;
export const HASH_SIZE = 60;

// JSON Web Tokens
export const JWT_ACCESS_EXPIRATON_TIME = 60 * 20; // Twenty minutes.
export const JWT_REFRESH_EXPIRATION_TIME = 60 * 60 * 24; // One day.

// Socket Management
export const DEAD_CONNECTION_CHECK_RATE = 1000 * 30; // Thirty seconds.

// Caching
export const CLIENT_CACHE_TTL = 60 * 3; // Three minutes.
export const TICKET_CACHE_TTL = 10; // Ten seconds.
