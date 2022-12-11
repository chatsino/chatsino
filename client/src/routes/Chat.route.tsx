import { ChatroomGenerator } from "helpers";
import { useState } from "react";
import { ChatMessageList } from "ui";

export function ChatRoute() {
  const someChatrooms = useChatrooms();
  const chatroom = someChatrooms[0];
  const [, setMessages] = useState(chatroom.messages);

  return (
    <ChatMessageList
      id="chat"
      chatroom={someChatrooms[0]}
      chatrooms={someChatrooms}
      onSendMessage={(message) => setMessages((prev) => prev.concat(message))}
    />
  );
}

function useChatrooms() {
  return ChatroomGenerator.generateChatroomList(30);
}
