export type SniperStatus = "open" | "closed";

export type Snipe = {
  userId: string;
  wager: number;
  shotAt: string;
};

export class SniperNotFoundError extends Error {
  statusCode = 404;
  message = "That game of sniper does not exist.";
}
