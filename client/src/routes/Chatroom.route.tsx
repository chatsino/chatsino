import { useSocket } from "hooks";
import { ChatroomLoaderData } from "loaders";
import { useEffect, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { ChatMessageList } from "ui";

export function ChatroomRoute() {
  const initialData = useLoaderData() as ChatroomLoaderData;
  const { chatroom, messages, sendMessage, pinMessage, deleteMessage } =
    useChatroomRoute(initialData);

  return (
    <ChatMessageList
      id="chat"
      chatroom={chatroom}
      messages={messages}
      onSendMessage={sendMessage}
      onPinMessage={pinMessage}
      onDeleteMessage={deleteMessage}
    />
  );
}

export function useChatroomRoute(initialData: ChatroomLoaderData) {
  const { chatroom, sendMessage, pinMessage, deleteMessage } = initialData;
  const { subscribe, unsubscribe } = useSocket();
  const [messages, setMessages] = useState(initialData.messages);

  // Receiving a new message.
  useEffect(() => {
    const subscription = `Chatrooms/${chatroom.id}/NewMessage`;

    subscribe(ChatroomRoute.name, subscription, async (response) => {
      const { message } = response.data as {
        message: ChatMessageData;
      };

      setMessages((prev) => prev.concat(message));
    });

    return () => {
      unsubscribe(ChatroomRoute.name, subscription);
    };
  }, [subscribe, unsubscribe, chatroom.id]);

  // Updating a message.
  useEffect(() => {
    const subscription = `Chatrooms/${chatroom.id}/MessageUpdated`;

    subscribe(ChatroomRoute.name, subscription, async (response) => {
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
      unsubscribe(ChatroomRoute.name, subscription);
    };
  }, [subscribe, unsubscribe, chatroom.id]);

  // Deleting a message.
  useEffect(() => {
    const subscription = `Chatrooms/${chatroom.id}/MessageDeleted`;

    subscribe(ChatroomRoute.name, subscription, async (response) => {
      const { messageId } = response.data as {
        messageId: number;
      };

      setMessages((prev) => prev.filter((each) => each.id !== messageId));
    });

    return () => {
      unsubscribe(ChatroomRoute.name, subscription);
    };
  }, [subscribe, unsubscribe, chatroom.id]);

  return {
    chatroom,
    messages,
    sendMessage,
    pinMessage,
    deleteMessage,
  };
}
