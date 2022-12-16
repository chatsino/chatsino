import { useCallback, useEffect, useRef, useState } from "react";
import { useClient } from "./useClient";
import { useSocket } from "./useSocket";

export interface ChatUser {
  id: number;
  avatar: string;
  username: string;
}

export interface Chatroom {
  id: number;
  avatar: string;
  title: string;
  description: string;
  users: [];
  messages: [];
  createdBy: ChatUser;
  updatedBy: ChatUser;
  createdAt: Date;
  updatedAt: Date;
}

enum ChatroomSocketRequests {
  SendChatMessage = "send-chat-message",
  ListChatrooms = "list-chatrooms",
  ListChatroomMessages = "list-chatroom-messages",
  VoteInPoll = "vote-in-poll",
  NewChatMessage = "new-chat-message",
}

export function useChatrooms() {
  const { makeRequest, subscribe, unsubscribe } = useSocket();
  const [chatrooms, setChatrooms] = useState([] as Array<Chatroom>);

  const listChatrooms = useCallback(async () => {
    const subscriberName = "useChatrooms/listChatrooms";
    const response = (await new Promise((resolve) => {
      makeRequest(ChatroomSocketRequests.ListChatrooms);
      subscribe(subscriberName, ChatroomSocketRequests.ListChatrooms, resolve);
    })) as unknown as {
      data: {
        chatrooms: Chatroom[];
      };
    };

    unsubscribe(subscriberName, ChatroomSocketRequests.ListChatrooms);
    setChatrooms(response.data.chatrooms);
  }, [makeRequest, subscribe, unsubscribe]);

  return {
    chatrooms,
    listChatrooms,
  };
}
