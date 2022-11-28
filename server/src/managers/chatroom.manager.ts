import { subscriber } from "persistence";

export enum ChatroomSocketRequests {
  SendChatMessage = "send-chat-message",
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",
  NewChatMessage = "new-chat-message",
}

export function initializeChatroomManager() {
  subscriber.subscribe(
    ChatroomSocketRequests.SendChatMessage,
    handleSendChatMessage
  );
  subscriber.subscribe(
    ChatroomSocketRequests.ListChatrooms,
    handleListChatrooms
  );
  subscriber.subscribe(
    ChatroomSocketRequests.ListChatroomMessages,
    handleListChatroomMessages
  );
}

export function handleSendChatMessage() {}

export function handleListChatroomMessages() {}

export function handleListChatrooms() {}
