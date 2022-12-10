import { useState } from "react";
import { ChatMessageGenerator } from "helpers";
import { ChatMessageList } from "ui";

export function ChatRoute() {
  const someMessages = useChatMessages();
  const [messages, setMessages] = useState(someMessages);

  return (
    <ChatMessageList
      id="chat"
      messages={messages}
      onSendMessage={(message) => setMessages((prev) => prev.concat(message))}
    />
  );
}

function useChatMessages() {
  return ChatMessageGenerator.generateRealisticChatMessageList(30);
}
