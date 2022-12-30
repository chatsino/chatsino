import { initializeMessageHandlers } from "./message";
import { initializeRoomHandlers } from "./room";
import { initializeRouletteHandlers } from "./roulette";
import { initializeSniperHandlers } from "./sniper";
import { initializeUserHandlers } from "./user";

export function initializeSocketMessageHandlers() {
  return Promise.all([
    initializeMessageHandlers(),
    initializeRoomHandlers(),
    initializeRouletteHandlers(),
    initializeSniperHandlers(),
    initializeUserHandlers(),
  ]);
}
