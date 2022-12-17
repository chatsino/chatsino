import * as config from "config";
import { Request } from "express";
import { decrypt, encrypt, now } from "helpers";
import { createLogger } from "logger";
import querystring from "node:querystring";
import {
  clearCachedValue,
  Client,
  ClientNotFoundError,
  getCachedValue,
  getClientByIdentifier,
  setCachedValue,
} from "persistence";

export interface Ticket {
  issuedAt: number;
  issuedTo: string;
  username: string;
}

export const TICKET_LOGGER = createLogger(config.LOGGER_NAMES.TICKET);

export async function issueTicket(username: string, remoteAddress: string) {
  const client = await getClientByIdentifier(username);

  if (!client) {
    throw new ClientNotFoundError();
  }

  const encryptedTicket = encryptTicket({
    issuedAt: now(),
    issuedTo: remoteAddress,
    username,
  });

  await setCachedValue(
    `Tickets/${encryptedTicket}`,
    JSON.stringify(client),
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

  const client = (await getCachedValue(`Tickets/${encryptedTicket}`)) as Client;

  if (!client) {
    TICKET_LOGGER.error({ client }, "Ticket not in cache.");

    return null;
  }

  const ticket = decryptTicket(encryptedTicket);

  // if (ticket.issuedTo !== remoteAddress) {
  //   TICKET_LOGGER.error(
  //     { ticket, remoteAddress },
  //     "Ticket not assigned to same address."
  //   );

  //   return null;
  // }

  await clearCachedValue(`Tickets/${encryptedTicket}`);

  return client;
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
