import { ChatroomLoaderData } from "loaders";
import { useCallback } from "react";
import { useLoaderData } from "react-router-dom";
import { ChatMessageList } from "ui";

export function ChatroomRoute() {
  const { chatroom, messages } = useLoaderData() as ChatroomLoaderData;
  const handleSendMessage = useCallback((message: string) => {}, []);

  return (
    <ChatMessageList
      id="chat"
      chatroom={chatroom}
      messages={messages}
      onSendMessage={handleSendMessage}
    />
  );
}
