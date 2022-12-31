import { MessageRequests } from "./message";
import { RoomRequests } from "./room";
import { RouletteRequests } from "./roulette";
import { SniperRequests } from "./sniper";
import { UserRequests } from "./user";

export const requests: Record<string, string> = {
  ...MessageRequests,
  ...RoomRequests,
  ...RouletteRequests,
  ...SniperRequests,
  ...UserRequests,
};

export const isValidRequest = (kind: string) =>
  Object.values(requests).includes(kind);
