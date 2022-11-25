import { subscriber } from "persistence";

export enum ChatroomSocketMessages {
  // Incoming
  SendChatMessage = "send-chat-message",
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",

  // Outgoing
  NewChatMessage = "new-chat-message",
}

export function initializeChatroomManager() {
  subscriber.on(ChatroomSocketMessages.SendChatMessage, handleSendChatMessage);
  subscriber.on(ChatroomSocketMessages.ListChatrooms, handleListChatrooms);
  subscriber.on(
    ChatroomSocketMessages.ListChatroomMessages,
    handleListChatroomMessages
  );
}

export function handleSendChatMessage() {}

export function handleListChatroomMessages() {}

export function handleListChatrooms() {}
