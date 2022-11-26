import * as config from "config";
import { generatePasswordSaltHash } from "helpers";
import { postgres, getCachedValue, setCachedValue } from "persistence";
import { PERMISSION_RANKING, clientSignupSchema } from "schemas";

export type ClientPermissionLevel =
  | "visitor"
  | "user"
  | "admin:limited"
  | "admin:unlimited";

export interface Client {
  id: number;
  username: string;
  permissionLevel: ClientPermissionLevel;
  chips: number;
  hash: string;
  salt: string;
}

export type SafeClient = Omit<Client, "hash" | "salt">;

export interface AuthenticatedClient {
  id: number;
  username: string;
  permissionLevel: ClientPermissionLevel;
}

export async function createClientTable() {
  const exists = await postgres.schema.hasTable("clients");

  if (!exists) {
    return postgres.schema.createTable("clients", (table) => {
      table.increments("id", { primaryKey: true });
      table.string("username").unique().notNullable();
      table
        .enu("permissionLevel", PERMISSION_RANKING)
        .defaultTo("user")
        .notNullable();
      table.specificType("hash", `CHAR(120) DEFAULT NULL`);
      table.specificType("salt", `CHAR(256) DEFAULT NULL`);
      table.integer("chips").defaultTo(0);
      table.timestamps(true, true, true);
    });
  }
}

export async function createClient(
  username: string,
  password: string,
  permissionLevel: ClientPermissionLevel = "user"
) {
  try {
    await clientSignupSchema.validate({ username, password });

    const { salt, hash } = await generatePasswordSaltHash(password);

    await postgres<Client>("clients").insert({
      username,
      hash,
      salt,
      permissionLevel,
    });

    return true;
  } catch (error) {
    return false;
  }
}

export async function updateClient(
  clientIdentifier: number | string,
  update: Partial<Client>
) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    await postgres<Client>("clients").where("id", client.id).update(update);

    return true;
  } else {
    return false;
  }
}

export function cacheClient(client: SafeClient) {
  const clientString = JSON.stringify(client);

  return Promise.all([
    setCachedValue(
      `Client/ById/${client.id}`,
      clientString,
      config.CLIENT_CACHE_TTL_SECONDS
    ),
    setCachedValue(
      `Client/ByUsername/${client.username}`,
      clientString,
      config.CLIENT_CACHE_TTL_SECONDS
    ),
  ]);
}

export function safetifyClient(client: Client): SafeClient {
  const { hash: _, salt: __, ...safeClient } = client;
  return safeClient;
}

export async function getClientById(clientId: number, breakCache = false) {
  const cached = await getCachedValue(`Client/ById/${clientId}`);

  if (cached && !breakCache) {
    return cached as SafeClient;
  } else {
    const client = await postgres<Client>("clients")
      .where("id", clientId)
      .first();

    if (client) {
      const safeClient = safetifyClient(client);
      cacheClient(safeClient);
      return safeClient;
    } else {
      return null;
    }
  }
}

export async function getClientByUsername(
  username: string,
  breakCache = false
) {
  const cached = await getCachedValue(`Client/ByUsername/${username}`);

  if (cached && !breakCache) {
    return cached as SafeClient;
  } else {
    const client = await postgres<Client>("clients")
      .where("username", username)
      .first();

    if (client) {
      const safeClient = safetifyClient(client);
      cacheClient(safeClient);
      return safeClient;
    } else {
      return null;
    }
  }
}

export function getClientByIdentifier(
  clientIdentifier: number | string,
  breakCache = false
) {
  return typeof clientIdentifier === "number"
    ? getClientById(clientIdentifier, breakCache)
    : getClientByUsername(clientIdentifier, breakCache);
}

export async function getClientChipBalance(clientIdentifier: number | string) {
  return (await getClientByIdentifier(clientIdentifier, true))?.chips ?? 0;
}

export async function canClientAfford(
  clientIdentifier: number | string,
  amount: number
) {
  return (await getClientChipBalance(clientIdentifier)) > amount;
}

export async function chargeClient(
  clientIdentifier: number | string,
  amount: number
) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    await postgres<Client>("clients")
      .where("id", client.id)
      .decrement("chips", amount);

    // Break cache.
    getClientByIdentifier(clientIdentifier, true);

    return true;
  } else {
    return false;
  }
}

export async function payClient(
  clientIdentifier: number | string,
  amount: number
) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    await postgres<Client>("clients")
      .where("id", client.id)
      .increment("chips", amount);

    // Break cache.
    getClientByIdentifier(clientIdentifier, true);

    return true;
  } else {
    return false;
  }
}

export async function changeClientPermissionLevel(
  clientIdentifier: number | string,
  permissionLevel: ClientPermissionLevel
) {
  return updateClient(clientIdentifier, { permissionLevel });
}

export class CannotChargeClientError extends Error {}
