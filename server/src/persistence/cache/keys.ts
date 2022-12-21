import * as config from "config";
import { buildCacheKey } from "helpers";

export const CLIENT_KEYS = {
  client: (clientId: number) =>
    buildCacheKey(config.CLIENT_CACHE_KEY, clientId),
  clientByUsername: (username: string) =>
    buildCacheKey(config.CLIENT_CACHE_KEY, "ByUsername", username),
};

export const CHATROOM_KEYS = {
  chatroom: (chatroomId: number) =>
    buildCacheKey(config.CHATROOM_CACHE_KEY, chatroomId),
  chatroomList: () => config.CHATROOM_LIST_CACHE_KEY,
  canClientMessageChatroom: (clientId: number, chatroomId: number) =>
    buildCacheKey(
      config.CAN_CLIENT_MESSAGE_CHATROOM_CACHE_KEY,
      clientId,
      chatroomId
    ),
  canClientModifyChatroom: (clientId: number, chatroomId: number) =>
    buildCacheKey(
      config.CAN_CLIENT_MODIFY_CHATROOM_CACHE_KEY,
      clientId,
      chatroomId
    ),
};

export const CHAT_MESSAGE_KEYS = {
  chatMessage: (messageId: number) =>
    buildCacheKey(config.CHAT_MESSAGE_CACHE_KEY, messageId),
  chatMessageList: (chatroomId: number) =>
    buildCacheKey(config.CHAT_MESSAGE_LIST_CACHE_KEY, chatroomId),
};
