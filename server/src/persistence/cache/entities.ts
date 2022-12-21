import * as config from "config";
import type {
  ChatMessage,
  Client,
  HydratedChatroom,
  HydratedChatMessage,
} from "models";
import { clearCachedValue, getCachedValue, setCachedValue } from "./cache";
import * as keys from "./keys";

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
};

export const CHATROOM_CACHE = {
  CHATROOM: {
    cache: (chatroom: HydratedChatroom) =>
      setCachedValue(
        keys.CHATROOM_KEYS.chatroom(chatroom.id),
        JSON.stringify(chatroom),
        config.CHATROOM_CACHE_TTL_SECONDS
      ),
    read: (chatroomId: number) =>
      getCachedValue(
        keys.CHATROOM_KEYS.chatroom(chatroomId)
      ) as Promise<null | HydratedChatroom>,
    clear: (chatroomId: number) =>
      clearCachedValue(keys.CHATROOM_KEYS.chatroom(chatroomId)),
  },
  CHATROOM_LIST: {
    cache: (chatroomList: HydratedChatroom[]) =>
      setCachedValue(
        keys.CHATROOM_KEYS.chatroomList(),
        JSON.stringify(chatroomList),
        config.CHATROOM_CACHE_TTL_SECONDS
      ),
    read: () =>
      getCachedValue(keys.CHATROOM_KEYS.chatroomList()) as Promise<
        null | HydratedChatroom[]
      >,
    clear: () => clearCachedValue(keys.CHATROOM_KEYS.chatroomList()),
  },
  CHATROOM_USERS: {
    cache: (chatroomId: number, clientIds: number[]) =>
      setCachedValue(
        keys.CHATROOM_KEYS.chatroomUsers(chatroomId),
        JSON.stringify(clientIds),
        config.CHATROOM_CACHE_TTL_SECONDS
      ),
    read: (chatroomId: number) =>
      getCachedValue(keys.CHATROOM_KEYS.chatroomUsers(chatroomId)) as Promise<
        null | number[]
      >,
    clear: (chatroomId: number) =>
      clearCachedValue(keys.CHATROOM_KEYS.chatroomUsers(chatroomId)),
    // Custom
    addClient: async (chatroomId: number, clientId: number) => {
      const currentlyCached = await CHATROOM_CACHE.CHATROOM_USERS.read(
        chatroomId
      );

      if (!currentlyCached) {
        return CHATROOM_CACHE.CHATROOM_USERS.cache(chatroomId, [clientId]);
      }

      if (currentlyCached && !currentlyCached.includes(clientId)) {
        return CHATROOM_CACHE.CHATROOM_USERS.cache(chatroomId, [
          ...currentlyCached,
          clientId,
        ]);
      }
    },
    removeClient: async (chatroomId: number, clientId: number) => {
      const currentlyCached = await CHATROOM_CACHE.CHATROOM_USERS.read(
        chatroomId
      );

      if (currentlyCached) {
        const remainingClients = currentlyCached.filter(
          (id) => id !== clientId
        );

        return remainingClients.length === 0
          ? CHATROOM_CACHE.CHATROOM_USERS.clear(chatroomId)
          : CHATROOM_CACHE.CHATROOM_USERS.cache(chatroomId, remainingClients);
      }
    },
    hydrated: async (chatroomId: number) => {
      const currentlyCached =
        (await CHATROOM_CACHE.CHATROOM_USERS.read(chatroomId)) ?? [];

      return (
        await Promise.all(
          currentlyCached.map((clientId) => CLIENT_CACHE.CLIENT.read(clientId))
        )
      ).filter(Boolean) as Client[];
    },
  },
  CAN_CLIENT_MESSAGE_CHATROOM: {
    cache: (
      clientId: number,
      chatroomId: number,
      result: { can: boolean; reason: string }
    ) => {
      const key = keys.CHATROOM_KEYS.canClientMessageChatroom(
        clientId,
        chatroomId
      );

      CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.cached.push(key);

      return setCachedValue(
        key,
        JSON.stringify(result),
        config.CHATROOM_CACHE_TTL_SECONDS
      );
    },
    read: (clientId: number, chatroomId: number) =>
      getCachedValue(
        keys.CHATROOM_KEYS.canClientMessageChatroom(clientId, chatroomId)
      ) as Promise<null | { can: boolean; reason: string }>,
    clear: (clientId: number, chatroomId: number) => {
      const key = keys.CHATROOM_KEYS.canClientMessageChatroom(
        clientId,
        chatroomId
      );

      CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.cached =
        CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.cached.filter(
          (each) => each !== key
        );

      return clearCachedValue(key);
    },
    // Custom
    cached: [] as string[],
    clearAllClients: (chatroomId: number) => {
      for (const [_, _cachedClientId, _cachedChatroomId] of CHATROOM_CACHE
        .CAN_CLIENT_MESSAGE_CHATROOM.cached) {
        const cachedClientId = parseInt(_cachedClientId);
        const cachedChatroomId = parseInt(_cachedChatroomId);

        if (cachedChatroomId === chatroomId) {
          CHATROOM_CACHE.CAN_CLIENT_MESSAGE_CHATROOM.clear(
            cachedClientId,
            cachedChatroomId
          );
        }
      }
    },
  },
  CAN_CLIENT_MODIFY_CHATROOM: {
    cache: (clientId: number, chatroomId: number, can: boolean) => {
      const key = keys.CHATROOM_KEYS.canClientModifyChatroom(
        clientId,
        chatroomId
      );

      CHATROOM_CACHE.CAN_CLIENT_MODIFY_CHATROOM.cached.push(key);

      return setCachedValue(
        key,
        JSON.stringify(can),
        config.CHATROOM_CACHE_TTL_SECONDS
      );
    },
    read: (clientId: number, chatroomId: number) =>
      getCachedValue(
        keys.CHATROOM_KEYS.canClientModifyChatroom(clientId, chatroomId)
      ) as Promise<null | boolean>,
    clear: (clientId: number, chatroomId: number) => {
      const key = keys.CHATROOM_KEYS.canClientModifyChatroom(
        clientId,
        chatroomId
      );

      CHATROOM_CACHE.CAN_CLIENT_MODIFY_CHATROOM.cached =
        CHATROOM_CACHE.CAN_CLIENT_MODIFY_CHATROOM.cached.filter(
          (each) => each !== key
        );

      return clearCachedValue(key);
    },
    // Custom
    cached: [] as string[],
    clearAllClients: (chatroomId: number) => {
      for (const [_, _cachedClientId, _cachedChatroomId] of CHATROOM_CACHE
        .CAN_CLIENT_MODIFY_CHATROOM.cached) {
        const cachedClientId = parseInt(_cachedClientId);
        const cachedChatroomId = parseInt(_cachedChatroomId);

        if (cachedChatroomId === chatroomId) {
          CHATROOM_CACHE.CAN_CLIENT_MODIFY_CHATROOM.clear(
            cachedClientId,
            cachedChatroomId
          );
        }
      }
    },
  },
};

export const CHAT_MESSAGE_CACHE = {
  CHAT_MESSAGE: {
    cache: (message: ChatMessage) =>
      setCachedValue(
        keys.CHAT_MESSAGE_KEYS.chatMessage(message.id),
        JSON.stringify(message),
        config.CHAT_MESSAGE_CACHE_TTL_SECONDS
      ),
    read: (messageId: number) =>
      getCachedValue(
        keys.CHAT_MESSAGE_KEYS.chatMessage(messageId)
      ) as Promise<null | ChatMessage>,
    clear: (messageId: number) =>
      clearCachedValue(keys.CHAT_MESSAGE_KEYS.chatMessage(messageId)),
  },
  CHAT_MESSAGE_LIST: {
    cache: (chatroomId: number, chatMessageList: HydratedChatMessage[]) =>
      setCachedValue(
        keys.CHAT_MESSAGE_KEYS.chatMessageList(chatroomId),
        JSON.stringify(chatMessageList),
        config.CHAT_MESSAGE_CACHE_TTL_SECONDS
      ),
    read: (chatroomId: number) =>
      getCachedValue(keys.CHAT_MESSAGE_KEYS.chatMessageList(chatroomId)),
    clear: (chatroomId: number) =>
      clearCachedValue(keys.CHAT_MESSAGE_KEYS.chatMessageList(chatroomId)),
  },
};
