import { clearCachedValue, getCachedValue, setCachedValue } from "cache";
import * as config from "config";
import { Request } from "express";
import { decrypt, encrypt, now } from "helpers";
import { createLogger } from "logger";
import { makeRequest, User, UserSocketRequests } from "models";
import querystring from "node:querystring";

export interface Ticket {
  issuedAt: number;
  issuedTo: string;
  userId: string;
}

export const TICKET_LOGGER = createLogger(config.LOGGER_NAMES.TICKET);

export async function issueTicket(userId: string, remoteAddress: string) {
  const { user } = (await makeRequest(UserSocketRequests.GetUser)) as {
    user: Nullable<User>;
  };

  if (!user || user.banDuration !== 0) {
    throw new Error("User is not eligible to receive a ticket.");
  }

  const encryptedTicket = encryptTicket({
    issuedAt: now(),
    issuedTo: remoteAddress,
    userId,
  });

  await setCachedValue(
    `Tickets/${encryptedTicket}`,
    JSON.stringify(user),
    config.TICKET_CACHE_TTL_SECONDS
  );

  return encryptedTicket;
}

export async function validateTicket(request: Request) {
  const { "/api?ticket": ticketQueryParam } = querystring.parse(request.url);
  const encryptedTicket = ticketQueryParam as string;
  const { remoteAddress } = request.socket;

  if (!encryptedTicket || !remoteAddress) {
    TICKET_LOGGER.error(
      { encryptedTicket, remoteAddress },
      "Missing ticket and/or remote address."
    );

    return null;
  }

  const user = (await getCachedValue(`Tickets/${encryptedTicket}`)) as User;

  if (!user) {
    return null;
  }

  // const ticket = decryptTicket(encryptedTicket);

  // if (ticket.issuedTo !== remoteAddress) {
  //   TICKET_LOGGER.error(
  //     { ticket, remoteAddress },
  //     "Ticket not assigned to same address."
  //   );

  //   return null;
  // }

  await clearCachedValue(`Tickets/${encryptedTicket}`);

  return user;
}

export function encryptTicket(ticket: Ticket) {
  const { encryptedData, iv } = encrypt(JSON.stringify(ticket));
  const encryptedTicket = Buffer.from([encryptedData, iv].join("&")).toString(
    "base64"
  );

  return encryptedTicket;
}

export function decryptTicket(encryptedTicket: string) {
  const value = Buffer.from(encryptedTicket, "base64").toString("utf-8");
  const [encryptedData, iv] = value.split("&");
  const ticket = JSON.parse(decrypt({ iv, encryptedData })) as Ticket;

  return ticket;
}
