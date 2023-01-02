// General
export const VERSION = process.env.VERSION as string;
export const PORT = process.env.PORT as string;

// Redis
export const API_HOST = "localhost";
export const API_PORT = 3001;
export const API_CONNECTION_STRING = `ws://${API_HOST}:${API_PORT}/api`;

export enum LOGGER_NAMES {
  SERVER = "Server",
  SIMULATION = "Simulation",
  SOCKETS = "Sockets",
}
