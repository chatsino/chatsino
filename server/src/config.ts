import path from "path";

// App
export const VERSION = process.env.VERSION as string;
export const PORT = process.env.PORT as string;

// Secrets
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const COOKIE_SECRET = process.env.COOKIE_SECRET as string;
export const TICKET_SECRET = process.env.TICKET_SECRET as string;

// Postgres
export const POSTGRES_HOST = process.env.POSTGRES_HOST as string;
export const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT as string);
export const POSTGRES_CONNECTION_STRING = process.env
  .POSTGRES_CONNECTION_STRING as string;

export const BLACKJACK_TABLE_NAME = "blackjack";
export const CHAT_MESSAGE_TABLE_NAME = "chat_message";
export const CHATROOM_TABLE_NAME = "chatroom";
export const CLIENT_TABLE_NAME = "client";
export const TRANSACTION_TABLE_NAME = "transaction";

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
export const TOKEN_CACHE_KEY = "jwt_label:Tokens/Access";
export const TICKET_CACHE_KEY = "Ticket";
export const TICKET_CACHE_TTL_SECONDS = 10;

export const CLIENT_CACHE_KEY = "Client";
export const CLIENT_BY_USERNAME_CACHE_KEY = "Client/ByUsername";
export const CLIENT_CACHE_TTL_SECONDS = 60 * 3;

export const CHATROOM_CACHE_KEY = "Chatroom";
export const CHATROOM_LIST_CACHE_KEY = "ChatroomList";
export const CAN_CLIENT_MESSAGE_CHATROOM_CACHE_KEY = "CanClientMessageChatroom";
export const CAN_CLIENT_MODIFY_CHATROOM_CACHE_KEY = "CanClientModifyChatroom";
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
export enum LOGGER_NAMES {
  SERVER = "Server",
  SOCKET_SERVER = "Socket Server",
  CACHE = "Persistence/Cache",
  REQUEST = "Middleware/Request",
  RESPONSE = "Helpers/Response",

  // Auth
  TICKET = "Auth/Tickets",
  TOKEN = "Auth/Tokens",

  // Cache
  OBJECT_MAPPER = "Cache/Object Mapper",

  // Router
  AUTH_ROUTER = "Router/Auth",
  CHAT_ROUTER = "Router/Chat",
  USER_ROUTER = "Router/User",

  // Models
  BLACKJACK_MODEL = "Models/Blackjack",
  CLIENT_MODEL = "Models/Client",
  CHAT_MESSAGE_MODEL = "Models/ChatMessage",
  CHATROOM_MODEL = "Models/Chatroom",
  TRANSACTION_MODEL = "Models/Transaction",

  // Managers
  BLACKJACK_MANAGER = "Managers/Blackjack",
  CLIENT_MANAGER = "Managers/Client",
  CHATROOM_MANAGER = "Managers/Chatroom",
  CHAT_MESSAGE_MANAGER = "Managers/ChatMessage",

  // Chat
  CHAT = "Chat",
}

// File Uploads
export const FILE_UPLOAD_DIRECTORY = path.join(__dirname, "../../uploads");
export const FILE_UPLOAD_URL = "https://localhost/file";
// export const
