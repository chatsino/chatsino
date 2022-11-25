import path from "path";

// Ports
export const PORT = process.env.PORT;
export const POSTGRES_PORT = 5432;
export const REDIS_PORT = 6379;

// Secrets
export const JWT_SECRET = process.env.JWT_SECRET ?? "";
export const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "";
export const TICKET_SECRET = process.env.TICKET_SECRET ?? "";

// SSL
export const SSL_KEY_PATH = path.join(__dirname, "../.ssh/localhost-key.pem");
export const SSL_CERTIFICATE_PATH = path.join(
  __dirname,
  "../.ssh/localhost.pem"
);

// Cache
export const TICKET_CACHE_TTL_SECONDS = 10;

// Sockets
export const CONNECTION_STATUS_CHECK_RATE_MS = 1000 * 30;
