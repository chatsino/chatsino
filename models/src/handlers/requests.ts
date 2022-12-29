import { RouletteRequests } from "./roulette";
import { UserRequests } from "./user";

export const requests: Record<string, string> = {
  ...RouletteRequests,
  ...UserRequests,
};

export const isValidRequest = (kind: string) => Boolean(requests[kind]);
