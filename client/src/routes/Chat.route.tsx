import { useChatrooms } from "hooks";
import { ChatMessageList } from "ui";

export function ChatRoute() {
  const {
    data: { chatrooms },
  } = useChatrooms();

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
