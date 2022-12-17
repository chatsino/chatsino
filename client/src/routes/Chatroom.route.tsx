import { useSocket } from "hooks";
import { ChatroomLoaderData } from "loaders";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { ChatMessageList } from "ui";

export function ChatroomRoute() {
  const { chatroom, messages } = useLoaderData() as ChatroomLoaderData;
  const { subscribe, unsubscribe } = useSocket();
  const navigate = useNavigate();
  const handleSendMessage = useCallback((message: string) => {}, []);
  const foo = useRevalidator();

  useEffect(() => {
    const subscription = `Chatrooms/${chatroom.id}/Messages`;

    subscribe(ChatroomRoute.name, subscription, async () => {
      foo.revalidate();
    });

    return () => {
      unsubscribe(ChatroomRoute.name, subscription);
    };
  }, [subscribe, unsubscribe, foo, chatroom.id]);

  return (
    <ChatMessageList
      id="chat"
      chatroom={chatroom}
      messages={messages}
      onSendMessage={handleSendMessage}
    />
  );
}
