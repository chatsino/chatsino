import * as config from "config";
import { generatePasswordHash, generatePasswordSaltHash } from "helpers";
import { createLogger } from "logger";
import { postgres, getCachedValue, setCachedValue } from "persistence";
import { PERMISSION_RANKING, clientSigninSchema } from "schemas";

export type ClientPermissionLevel =
  | "visitor"
  | "user"
  | "admin:limited"
  | "admin:unlimited";

export interface FullClient {
  id: number;
  username: string;
  permissionLevel: ClientPermissionLevel;
  chips: number;
  hash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export type Client = Omit<FullClient, "hash" | "salt">;

export type ClientIdentifier = number | string;

export const CLIENT_MODEL_LOGGER = createLogger("Client Model");

export async function createClientTable() {
  const exists = await postgres.schema.hasTable("clients");

  if (exists) {
    CLIENT_MODEL_LOGGER.info("Clients table exists.");
  } else {
    CLIENT_MODEL_LOGGER.info("Creating clients table.");

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

export async function dropClientTable() {
  if (process.env.NODE_ENV !== "production") {
    const exists = await postgres.schema.hasTable("clients");

    if (exists) {
      CLIENT_MODEL_LOGGER.info("Dropping clients table.");

      return postgres.schema.dropTable("clients");
    } else {
      CLIENT_MODEL_LOGGER.info("Clients table does not exist.");
    }
  }
}

export async function createClient(
  username: string,
  password: string,
  permissionLevel: ClientPermissionLevel = "user"
) {
  try {
    await clientSigninSchema.validate({ username, password });

    const { salt, hash } = await generatePasswordSaltHash(password);

    await postgres<FullClient>("clients").insert({
      username,
      hash,
      salt,
      permissionLevel,
    });

    const client = await getClientByIdentifier(username);

    if (!client) {
      throw new Error("Client was not found after creation.");
    }

    return client;
  } catch (error) {
    if (error instanceof Error) {
      const asPostgresError = error as { constraint?: string };

      if (asPostgresError.constraint === "clients_username_unique") {
        throw new ClientWithUsernameExistsError(username);
      }
    }

    throw error;
  }
}

export async function updateClient(
  clientIdentifier: ClientIdentifier,
  update: Partial<FullClient>
) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    await postgres<FullClient>("clients").where("id", client.id).update(update);

    return true;
  } else {
    return false;
  }
}

export async function deleteClient(clientIdentifier: ClientIdentifier) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    await postgres<FullClient>("clients").where("id", client.id).delete();

    return true;
  } else {
    return false;
  }
}

export async function verifyClientPassword(
  clientIdentifier: ClientIdentifier,
  password: string
) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    const unsafeClient = await postgres<FullClient>("clients")
      .where("id", client.id)
      .first();

    if (!unsafeClient) {
      throw new ClientNotFoundError();
    }

    const hash = await generatePasswordHash(password, unsafeClient!.salt);

    if (hash !== unsafeClient.hash) {
      throw new IncorrectPasswordError();
    }

    return client;
  } else {
    return null;
  }
}

export function cacheClient(client: Client) {
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

export function safetifyClient(client: FullClient): Client {
  const { hash: _, salt: __, ...safeClient } = client;
  return safeClient;
}

export async function getClientById(clientId: number, breakCache = false) {
  const cached = await getCachedValue(`Client/ById/${clientId}`);

  if (cached && !breakCache) {
    return cached as Client;
  } else {
    const client = await postgres<FullClient>("clients")
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
    return cached as Client;
  } else {
    const client = await postgres<FullClient>("clients")
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
  clientIdentifier: ClientIdentifier,
  breakCache = false
) {
  return typeof clientIdentifier === "number"
    ? getClientById(clientIdentifier, breakCache)
    : getClientByUsername(clientIdentifier, breakCache);
}

export async function getClientChipBalance(clientIdentifier: ClientIdentifier) {
  return (await getClientByIdentifier(clientIdentifier, true))?.chips ?? 0;
}

export async function canClientAfford(
  clientIdentifier: ClientIdentifier,
  amount: number
) {
  return (await getClientChipBalance(clientIdentifier)) > amount;
}

export async function chargeClient(
  clientIdentifier: ClientIdentifier,
  amount: number
) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    await postgres<FullClient>("clients")
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
  clientIdentifier: ClientIdentifier,
  amount: number
) {
  const client = await getClientByIdentifier(clientIdentifier);

  if (client) {
    await postgres<FullClient>("clients")
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
  clientIdentifier: ClientIdentifier,
  permissionLevel: ClientPermissionLevel
) {
  return updateClient(clientIdentifier, { permissionLevel });
}

export class IncorrectPasswordError extends Error {}
export class ClientWithUsernameExistsError extends Error {
  constructor(username: string) {
    super();
    this.message = `The username "${username}" is taken.`;
  }
}
export class CannotChargeClientError extends Error {}
export class ClientNotFoundError extends Error {}