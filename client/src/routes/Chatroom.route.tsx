import { useSocket } from "hooks";
import { ChatroomLoaderData } from "loaders";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData } from "react-router-dom";
import { ChatMessageList } from "ui";

export function ChatroomRoute() {
  const initialData = useLoaderData() as ChatroomLoaderData;
  const { chatroom, messages, sendMessage } = useChatroomRoute(initialData);

  return (
    <ChatMessageList
      id="chat"
      chatroom={chatroom}
      messages={messages}
      onSendMessage={sendMessage}
    />
  );
}

export function useChatroomRoute(initialData: ChatroomLoaderData) {
  const { chatroom, sendMessage } = initialData;
  const { subscribe, unsubscribe } = useSocket();
  const [messages, setMessages] = useState(initialData.messages);
  const handleAddMessage = useCallback(
    (message: ChatMessageData) => setMessages((prev) => prev.concat(message)),
    []
  );

  useEffect(() => {
    const subscription = `Chatrooms/${chatroom.id}/Messages`;

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

  return {
    chatroom,
    messages,
    sendMessage,
  };
}
