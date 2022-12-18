import path from "path";

// App
export const VERSION = process.env.VERSION;
export const PORT = process.env.PORT;

// Secrets
export const JWT_SECRET = process.env.JWT_SECRET ?? "";
export const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "";
export const TICKET_SECRET = process.env.TICKET_SECRET ?? "";

// Postgres
export const POSTGRES_HOST = process.env.POSTGRES_HOST;
export const POSTGRES_PORT = 5432;
export const POSTGRES_CONNECTION_STRING =
  process.env.POSTGRES_CONNECTION_STRING ?? "";

export const BLACKJACK_TABLE_NAME = "blackjack";
export const CHAT_MESSAGE_TABLE_NAME = "chat_message";
export const CHATROOM_TABLE_NAME = "chatroom";
export const CLIENT_TABLE_NAME = "client";
export const TRANSACTION_TABLE_NAME = "transaction";

// Redis
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = 6379;
export const REDIS_CONNECTION_STRING =
  process.env.REDIS_CONNECTION_STRING ?? "";

// Caching
export const TICKET_CACHE_KEY = "Ticket";
export const TICKET_CACHE_TTL_SECONDS = 10;

export const CLIENT_CACHE_KEY = "Client";
export const CLIENT_BY_USERNAME_CACHE_KEY = "Client/ByUsername";
export const CLIENT_CACHE_TTL_SECONDS = 60 * 3;

export const CHATROOM_CACHE_KEY = "Chatroom";
export const CHATROOM_LIST_CACHE_KEY = "ChatroomList";
export const CAN_CLIENT_MESSAGE_CHATROOM_CACHE_KEY = "CanClientMessageChatroom";
export const CHATROOM_CACHE_TTL_SECONDS = 60 * 3;

export const CHAT_MESSAGE_CACHE_KEY = "ChatMessage";
export const CHAT_MESSAGE_LIST_CACHE_KEY = "ChatMessageList";
export const CHAT_MESSAGE_CACHE_TTL_SECONDS = 60 * 3;

// Sockets
export const CONNECTION_STATUS_CHECK_RATE_MS = 1000 * 30;

// Auth
export const MINIMUM_PASSWORD_SIZE = 8;
export const PASSWORD_SALT_SIZE = 128;
export const PASSWORD_HASH_SIZE = 60;
export const JWT_ACCESS_EXPIRATON_TIME_SECONDS = 60 * 20;

// Logging
export const LOGGER_NAMES = {
  AUTH_ROUTER: "Router/Auth",
  CHAT_ROUTER: "Router/Chat",
  TICKET: "Auth/Tickets",
  TOKEN: "Auth/Tokens",
  REQUEST: "Middleware/Request",
  RESPONSE: "Helpers/Response",
  BLACKJACK_MODEL: "Managers/Blackjack",
  CHAT_MESSAGE_MODEL: "Models/ChatMessage",
  CHATROOM_MODEL: "Models/Chatroom",
  CHATROOM_MANAGER: "Managers/Chatroom",
  CLIENT_MODEL: "Models/Client",
  TRANSACTION_MODEL: "Models/Transaction",
  CACHE: "Persistence/Cache",
  SERVER: "Server",
  SOCKET_SERVER: "Socket Server",
};

// File Uploads
export const FILE_UPLOAD_DIRECTORY = path.join(__dirname, "../../uploads");
