import { useSocket } from "hooks";
import { ChatroomLoaderData } from "loaders";
import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { CHATROOM_SUBSCRIPTIONS } from "subscriptions";
import uuid from "uuid4";

export function useUpdatingChatroom() {
  const identifier = useRef(uuid());
  const { chatroom: initialChatroom, messages: initialMessages } =
    useLoaderData() as ChatroomLoaderData;
  const { subscribe, unsubscribe } = useSocket();
  const [chatroom, setChatroom] = useState(initialChatroom);
  const [messages, setMessages] = useState(initialMessages);

  // Updating chatroom.
  useEffect(() => {
    const relevantIdentifier = identifier.current;
    const subscription = CHATROOM_SUBSCRIPTIONS.chatroomUpdated(chatroom.id);

    subscribe(relevantIdentifier, subscription, (response) => {
      const { chatroom: updatedChatroom } = response.data as {
        chatroom: ChatroomData;
      };

      setChatroom(updatedChatroom);
    });

    return () => {
      unsubscribe(relevantIdentifier, subscription);
    };
  }, [subscribe, unsubscribe, chatroom.id]);

  // Receiving a new message.
  useEffect(() => {
    const relevantIdentifier = identifier.current;
    const subscription = CHATROOM_SUBSCRIPTIONS.newChatMessage(chatroom.id);

    subscribe(relevantIdentifier, subscription, (response) => {
      const { message } = response.data as {
        message: ChatMessageData;
      };

      setMessages((prev) => prev.concat(message));
    });

    return () => {
      unsubscribe(relevantIdentifier, subscription);
    };
  }, [subscribe, unsubscribe, chatroom.id]);

  // Updating a message.
  useEffect(() => {
    const relevantIdentifier = identifier.current;
    const subscription = CHATROOM_SUBSCRIPTIONS.chatMessageUpdated(chatroom.id);

    subscribe(relevantIdentifier, subscription, (response) => {
      const { message } = response.data as {
        message: ChatMessageData;
      };

      setMessages((prev) =>
        prev.map((existingMessage) =>
          existingMessage.id === message.id ? message : existingMessage
        )
      );
    });

    return () => {
      unsubscribe(relevantIdentifier, subscription);
    };
  }, [subscribe, unsubscribe, chatroom.id]);

  // Deleting a message.
  useEffect(() => {
    const relevantIdentifier = identifier.current;
    const subscription = CHATROOM_SUBSCRIPTIONS.chatMessageDeleted(chatroom.id);

    subscribe(relevantIdentifier, subscription, (response) => {
      const { messageId } = response.data as {
        messageId: number;
      };

      setMessages((prev) => prev.filter((each) => each.id !== messageId));
    });

    return () => {
      unsubscribe(relevantIdentifier, subscription);
    };
  }, [subscribe, unsubscribe, chatroom.id]);

  return {
    chatroom,
    messages,
  };
}
