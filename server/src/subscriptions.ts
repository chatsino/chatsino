import * as config from "config";
import { buildCacheKey } from "helpers";

export const CHATROOM_SUBSCRIPTIONS = {
  chatroomUpdated: (chatroomId: number) =>
    buildCacheKey(config.CHATROOM_CACHE_KEY, chatroomId, "Updated"),
  newChatMessage: (chatroomId: number) =>
    buildCacheKey(config.CHATROOM_CACHE_KEY, chatroomId, "NewMessage"),
  chatMessageUpdated: (chatroomId: number) =>
    buildCacheKey(config.CHATROOM_CACHE_KEY, chatroomId, "MessageUpdated"),
  chatMessageDeleted: (chatroomId: number) =>
    buildCacheKey(config.CHATROOM_CACHE_KEY, chatroomId, "MessageDeleted"),
};
