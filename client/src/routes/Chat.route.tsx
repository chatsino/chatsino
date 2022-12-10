import { useState } from "react";
import { ChatMessageGenerator } from "helpers";
import { ChatMessageList } from "ui";

function useChatMessages() {
  return ChatMessageGenerator.generateChatMessageList(100);
}

export function ChatRoute() {
  const someMessages = useChatMessages();
  const [messages, setMessages] = useState(someMessages);

  return (
    <ChatMessageList
      messages={messages}
      onSendMessage={(message) => setMessages((prev) => prev.concat(message))}
    />
  );
}
