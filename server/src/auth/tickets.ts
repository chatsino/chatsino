import { Request } from "express";
import querystring from "node:querystring";
import {
  clearCachedValue,
  getCachedValue,
  getClientByUsername,
  setCachedValue,
} from "persistence";
import { decrypt, encrypt, now } from "helpers";
import { Client } from "schemas";

export interface Ticket {
  issuedAt: number;
  issuedTo: string;
  username: string;
}

export async function issueTicket(username: string, remoteAddress: string) {
  const client = await getClientByUsername(username);

  if (!client) {
    throw new ClientNotFoundError();
  }

  const encryptedTicket = encryptTicket({
    issuedAt: now(),
    issuedTo: remoteAddress,
    username,
  });

  await setCachedValue(encryptedTicket, client);

  return encryptedTicket;
}

export async function validateTicket(request: Request) {
  const { "/?ticket": ticketQueryParam } = querystring.parse(request.url);
  const encryptedTicket = ticketQueryParam as string;
  const { remoteAddress } = request.socket;

  if (!encryptedTicket || !remoteAddress) {
    return null;
  }

  const client = await getCachedValue<Client>(encryptedTicket);

  if (!client) {
    return null;
  }

  const ticket = decryptTicket(encryptedTicket);

  if (ticket.issuedTo !== remoteAddress) {
    return null;
  }

  await clearCachedValue(encryptedTicket);

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

export class ClientNotFoundError extends Error {}
