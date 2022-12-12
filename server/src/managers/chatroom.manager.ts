import { SUBSCRIBER } from "persistence";

export enum ChatroomSocketRequests {
  SendChatMessage = "send-chat-message",
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",
  NewChatMessage = "new-chat-message",
}

export function initializeChatroomManager() {
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.SendChatMessage,
    handleSendChatMessage
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ListChatrooms,
    handleListChatrooms
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ListChatroomMessages,
    handleListChatroomMessages
  );
}

export function handleSendChatMessage() {}

export function handleListChatroomMessages() {}

export function handleListChatrooms() {}

//
