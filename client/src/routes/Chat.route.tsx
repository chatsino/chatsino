import { useChatrooms } from "hooks";
import { useCallback } from "react";
import { ChatMessageList } from "ui";

export function ChatRoute() {
  const {
    data: { chatrooms, chatroomMessages },
    requests: { sendChatMessage },
  } = useChatrooms();

  const handleSendMessage = useCallback(
    (message: string) => sendChatMessage(chatrooms[0]?.id, message),
    [chatrooms, sendChatMessage]
  );

  return chatrooms.length === 0 ? (
    <>Loading...</>
  ) : (
    <ChatMessageList
      id="chat"
      chatroom={chatrooms[0]}
      chatrooms={chatrooms}
      messages={chatroomMessages[chatrooms[0].id] ?? []}
      onSendMessage={handleSendMessage}
    />
  );
}
