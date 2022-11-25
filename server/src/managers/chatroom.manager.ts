import { subscriber } from "persistence";

export enum ChatSocketMessages {
  // Incoming
  SendChatMessage = "send-chat-message",
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",

  // Outgoing
  NewChatMessage = "new-chat-message",
}

export function initializeChatroomManager() {
  subscriber.on(ChatSocketMessages.SendChatMessage, handleSendChatMessage);
  subscriber.on(ChatSocketMessages.ListChatrooms, handleListChatrooms);
  subscriber.on(
    ChatSocketMessages.ListChatroomMessages,
    handleListChatroomMessages
  );
}

export function handleSendChatMessage() {}

export function handleListChatroomMessages() {}

export function handleListChatrooms() {}
