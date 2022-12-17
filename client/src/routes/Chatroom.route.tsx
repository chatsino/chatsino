import { useSocket } from "hooks";
import { ChatroomLoaderData } from "loaders";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { ChatMessageList } from "ui";

export function ChatroomRoute() {
  const initialData = useLoaderData() as ChatroomLoaderData;
  const { chatroom, messages, sendMessage, deleteMessage } =
    useChatroomRoute(initialData);

  return (
    <ChatMessageList
      id="chat"
      chatroom={chatroom}
      messages={messages}
      onSendMessage={sendMessage}
      onDeleteMessage={deleteMessage}
    />
  );
}

export function useChatroomRoute(initialData: ChatroomLoaderData) {
  const { chatroom, sendMessage, deleteMessage } = initialData;
  const { subscribe, unsubscribe } = useSocket();
  const [messages, setMessages] = useState(initialData.messages);
  const handleAddMessage = useCallback(
    (message: ChatMessageData) => setMessages((prev) => prev.concat(message)),
    []
  );
  const handleDeleteMessage = useCallback(
    (messageId: number) =>
      setMessages((prev) => prev.filter((each) => each.id !== messageId)),
    []
  );

  // Receiving a new message.
  useEffect(() => {
    const subscription = `Chatrooms/${chatroom.id}/NewMessage`;

    subscribe(ChatroomRoute.name, subscription, async (response) => {
      const { message } = response.data as {
        message: ChatMessageData;
      };

      handleAddMessage(message);
    });

    return () => {
      unsubscribe(ChatroomRoute.name, subscription);
    };
  }, [subscribe, unsubscribe, handleAddMessage, chatroom.id]);

  // Deleting a message.
  useEffect(() => {
    const subscription = `Chatrooms/${chatroom.id}/MessageDeleted`;

    subscribe(ChatroomRoute.name, subscription, async (response) => {
      const { messageId } = response.data as {
        messageId: number;
      };

      handleDeleteMessage(messageId);
    });

    return () => {
      unsubscribe(ChatroomRoute.name, subscription);
    };
  }, [subscribe, unsubscribe, handleDeleteMessage, chatroom.id]);

  return {
    chatroom,
    messages,
    sendMessage,
    deleteMessage,
  };
}
