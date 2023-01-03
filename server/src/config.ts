import path from "path";

// App
export const VERSION = process.env.VERSION as string;
export const PORT = process.env.PORT as string;

// Redis
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = parseInt(process.env.REDIS_PORT as string);
export const REDIS_CONNECTION_STRING = process.env
  .REDIS_CONNECTION_STRING as string;

// Caching
export const MODELS_HOST = process.env.MODELS_HOST;
export const MODELS_PORT = parseInt(process.env.MODELS_PORT as string);
export const MODELS_CONNECTION_STRING = process.env
  .MODELS_CONNECTION_STRING as string;
export const MODELS_RECONNECT_ATTEMPT_RATES_MS = [
  1000, 1000, 2000, 3000, 5000, 8000, 13000, 21000, 34000,
];

// Secrets
export const SESSION_SECRET = process.env.SESSION_SECRET as string;
export const COOKIE_SECRET = process.env.COOKIE_SECRET as string;
export const TICKET_SECRET = process.env.TICKET_SECRET as string;

// Sockets
export const CONNECTION_STATUS_CHECK_RATE_MS = 1000 * 30;

// Auth
export const TICKET_CACHE_TTL_SECONDS = 10;
export const MINIMUM_PASSWORD_SIZE = 8;

// Logging
export enum LOGGER_NAMES {
  CACHE = "Cache",
  CHAT = "Chat",
  REQUEST = "Request",
  RESPONSE = "Response",
  SERVER = "Server",
  SOCKET_SERVER = "Socket Server",
  TICKET = "Tickets",

  // Routers
  AUTH_ROUTER = "Router/Auth",
  CHAT_ROUTER = "Router/Chat",
  USER_ROUTER = "Router/User",
}

// File Uploads
export const FILE_UPLOAD_DIRECTORY = path.join(
  __dirname,
  "../../volumes/uploads"
);
export const FILE_UPLOAD_URL = "https://localhost/file";
