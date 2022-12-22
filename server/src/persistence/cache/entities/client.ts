import * as config from "config";
import type { Client } from "models";
import {
  clearCachedValue,
  decrement,
  entryExists,
  getCachedValue,
  hashDecrementBy,
  hashIncrementBy,
  hashmapGet,
  hashmapGetAll,
  hashmapSet,
  hashmapSetObject,
  increment,
  setAdd,
  setCachedValue,
  setRemove,
} from "../cache";
import * as keys from "../keys";

export const CLIENT_CACHE = {
  CLIENT: {
    cache: (client: Client) =>
      setCachedValue(
        keys.CLIENT_KEYS.client(client.id),
        JSON.stringify(client),
        config.CLIENT_CACHE_TTL_SECONDS
      ),
    read: (clientId: number) =>
      getCachedValue(
        keys.CLIENT_KEYS.client(clientId)
      ) as Promise<null | Client>,
    clear: (clientId: number) =>
      clearCachedValue(keys.CLIENT_KEYS.client(clientId)),
  },
  CLIENT_BY_USERNAME: {
    cache: (client: Client) =>
      setCachedValue(
        keys.CLIENT_KEYS.clientByUsername(client.username),
        JSON.stringify(client),
        config.CLIENT_CACHE_TTL_SECONDS
      ),
    read: (username: string) =>
      getCachedValue(
        keys.CLIENT_KEYS.clientByUsername(username)
      ) as Promise<null | Client>,
    clear: (username: string) =>
      clearCachedValue(keys.CLIENT_KEYS.clientByUsername(username)),
  },
  CLIENT_CURRENT_CHATROOM: {
    cache: (clientId: number, chatroomId: number) =>
      setCachedValue(
        keys.CLIENT_KEYS.clientCurrentChatroom(clientId),
        JSON.stringify(chatroomId),
        config.CLIENT_CACHE_TTL_SECONDS
      ),
    read: (clientId: number) =>
      getCachedValue(
        keys.CLIENT_KEYS.clientCurrentChatroom(clientId)
      ) as Promise<null | number>,
    clear: (clientId: number) =>
      clearCachedValue(keys.CLIENT_KEYS.clientCurrentChatroom(clientId)),
  },
  ACTIVE_CLIENTS: {
    cache: (clientIds: number[]) =>
      setCachedValue(
        keys.CLIENT_KEYS.activeClients(),
        JSON.stringify(clientIds),
        config.CLIENT_CACHE_TTL_SECONDS
      ),
    read: () =>
      getCachedValue(keys.CLIENT_KEYS.activeClients()) as Promise<
        null | number[]
      >,
    clear: () => clearCachedValue(keys.CLIENT_KEYS.activeClients()),
    // Custom
    addClient: async (clientId: number) => {
      const currentlyCached = await CLIENT_CACHE.ACTIVE_CLIENTS.read();

      await CLIENT_CACHE.INACTIVE_CLIENTS.removeClient(clientId);

      if (!currentlyCached) {
        return CLIENT_CACHE.ACTIVE_CLIENTS.cache([clientId]);
      }

      if (currentlyCached && !currentlyCached.includes(clientId)) {
        return CLIENT_CACHE.ACTIVE_CLIENTS.cache([
          ...currentlyCached,
          clientId,
        ]);
      }
    },
    removeClient: async (clientId: number) => {
      const currentlyCached = await CLIENT_CACHE.ACTIVE_CLIENTS.read();

      if (currentlyCached) {
        const remainingClients = currentlyCached.filter(
          (id) => id !== clientId
        );

        return remainingClients.length === 0
          ? CLIENT_CACHE.ACTIVE_CLIENTS.clear()
          : CLIENT_CACHE.ACTIVE_CLIENTS.cache(remainingClients);
      }
    },
    hydrated: async () => {
      const currentlyCached = (await CLIENT_CACHE.ACTIVE_CLIENTS.read()) ?? [];

      return (
        await Promise.all(
          currentlyCached.map((clientId) => CLIENT_CACHE.CLIENT.read(clientId))
        )
      ).filter(Boolean) as Client[];
    },
  },
  INACTIVE_CLIENTS: {
    cache: (clientIds: number[]) =>
      setCachedValue(
        keys.CLIENT_KEYS.inactiveClients(),
        JSON.stringify(clientIds),
        config.CLIENT_CACHE_TTL_SECONDS
      ),
    read: () =>
      getCachedValue(keys.CLIENT_KEYS.inactiveClients()) as Promise<
        null | number[]
      >,
    clear: () => clearCachedValue(keys.CLIENT_KEYS.inactiveClients()),
    // Custom
    addClient: async (clientId: number) => {
      const currentlyCached = await CLIENT_CACHE.INACTIVE_CLIENTS.read();

      await CLIENT_CACHE.ACTIVE_CLIENTS.removeClient(clientId);

      if (!currentlyCached) {
        return CLIENT_CACHE.INACTIVE_CLIENTS.cache([clientId]);
      }

      if (currentlyCached && !currentlyCached.includes(clientId)) {
        return CLIENT_CACHE.INACTIVE_CLIENTS.cache([
          ...currentlyCached,
          clientId,
        ]);
      }
    },
    removeClient: async (clientId: number) => {
      const currentlyCached = await CLIENT_CACHE.INACTIVE_CLIENTS.read();

      if (currentlyCached) {
        const remainingClients = currentlyCached.filter(
          (id) => id !== clientId
        );

        return remainingClients.length === 0
          ? CLIENT_CACHE.INACTIVE_CLIENTS.clear()
          : CLIENT_CACHE.INACTIVE_CLIENTS.cache(remainingClients);
      }
    },
    hydrated: async () => {
      const currentlyCached =
        (await CLIENT_CACHE.INACTIVE_CLIENTS.read()) ?? [];

      return (
        await Promise.all(
          currentlyCached.map((clientId) => CLIENT_CACHE.CLIENT.read(clientId))
        )
      ).filter(Boolean) as Client[];
    },
  },
  CLIENT_SESSION: {
    begin: async (client: Client) => {
      const sessionKey = `client:session:${client.id}`;
      const activeClientsKey = "clients:active";
      const now = new Date().toString();
      const existingEntry = await entryExists(sessionKey);

      if (existingEntry) {
        await hashIncrementBy(sessionKey, "active", 1);
        await hashmapSet(sessionKey, "lastActive", now);
      } else {
        await setAdd(activeClientsKey, client.id.toString());
        await hashmapSetObject(sessionKey, {
          ...client,
          sessionStarted: now,
          lastActive: now,
          active: 1,
        });
      }
    },
    end: async (client: Client) => {
      const sessionKey = `client:session:${client.id}`;
      const roomsKey = `client:rooms:${client.id}`;
      const activeClientsKey = "clients:active";
      const now = new Date().toString();
      const remainingSessions = await hashDecrementBy(sessionKey, "active", 1);

      if (remainingSessions === 0) {
        await setRemove(activeClientsKey, client.id.toString());
        await clearCachedValue(roomsKey);
      }

      await hashmapSet(sessionKey, "lastActive", now);
    },
  },
};
