// General
export const VERSION = process.env.VERSION as string;
export const PORT = process.env.PORT as string;

// Redis
export const API_HOST = "localhost";
export const API_PORT = 3001;
export const API_CONNECTION_STRING = `ws://${API_HOST}:${API_PORT}/api`;
export const API_REQUEST_URL = `http://${API_HOST}:${API_PORT}/api`;

// Simulation Parameters
export const SIMULATED_ENTITY_PREFIX = "SIM_";
export const SIMULATED_USER_PASSWORD = "SIM_ABC123";
export const MAX_SESSION_COUNT = 1; // How many simulated users can be active at once?
export const SESSION_TICK_RATES_MS = [1000, 3000]; // Minimum/maximum time between actions taken.
export const SESSION_OPEN_CHANCE = 20; // %
export const SESSION_CLOSE_CHANCE = 10; // %
export const MESSAGE_SEND_CHANCE = 50; // %
export const ROOM_CREATE_CHANCE = 3; // %

export enum LOGGER_NAMES {
  SERVER = "Server",
  SIMULATION = "Simulation",
  SOCKETS = "Sockets",
}
