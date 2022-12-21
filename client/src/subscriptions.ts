import * as config from "config";

const buildCacheKey = (...args: (string | number)[]) => args.join("/");

export const CHATROOM_SUBSCRIPTIONS = {
  chatroomUpdated: (chatroomId: number) =>
    buildCacheKey(config.CHATROOM_SUBSCRIPTION_KEY, chatroomId, "Updated"),
  newChatMessage: (chatroomId: number) =>
    buildCacheKey(config.CHATROOM_SUBSCRIPTION_KEY, chatroomId, "NewMessage"),
  chatMessageUpdated: (chatroomId: number) =>
    buildCacheKey(
      config.CHATROOM_SUBSCRIPTION_KEY,
      chatroomId,
      "MessageUpdated"
    ),
  chatMessageDeleted: (chatroomId: number) =>
    buildCacheKey(
      config.CHATROOM_SUBSCRIPTION_KEY,
      chatroomId,
      "MessageDeleted"
    ),
};
