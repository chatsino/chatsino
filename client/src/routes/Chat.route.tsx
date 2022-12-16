import { useChatrooms, useSocket } from "hooks";
import { useEffect } from "react";
import { ChatMessageList } from "ui";

export function ChatRoute() {
  const { chatrooms, listChatrooms } = useChatrooms();
  const { initialized } = useSocket();

  useEffect(() => {
    if (initialized) {
      listChatrooms();
    }
  }, [initialized, listChatrooms]);

  return chatrooms.length === 0 ? (
    <>Loading...</>
  ) : (
    <ChatMessageList
      id="chat"
      chatroom={chatrooms[0]}
      chatrooms={chatrooms}
      onSendMessage={(message) => {}}
    />
  );
}
