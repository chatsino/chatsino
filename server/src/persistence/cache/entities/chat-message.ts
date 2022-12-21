import * as config from "config";
import type { ChatMessage, HydratedChatMessage } from "models";
import { clearCachedValue, getCachedValue, setCachedValue } from "../cache";
import * as keys from "../keys";

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
