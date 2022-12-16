// Re-export all configuration shared between client and server.
export * from "../shared/config";

// export const SOCKET_SERVER_ADDRESS = "wss://localhost/api";
export const SOCKET_SERVER_ADDRESS = "ws://localhost:3001/api";
export const API_BASE_URL = "/api";
export const API_TIMEOUT = 1000;
export const SOCKET_RECONNECT_ATTEMPT_RATE = 5000;
