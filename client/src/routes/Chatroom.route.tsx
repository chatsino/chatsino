import { useUpdatingChatroom } from "hooks";
import { ChatroomLoaderData } from "loaders";
import { Outlet, useLoaderData } from "react-router-dom";
import { Chatroom } from "ui";

export function ChatroomRoute() {
  const { sendMessage, pinMessage, deleteMessage } =
    useLoaderData() as ChatroomLoaderData;
  const { chatroom, messages } = useUpdatingChatroom();

  return (
    <div style={{ position: "relative" }}>
      <Chatroom
        id="chat"
        chatroom={chatroom}
        messages={messages}
        onSendMessage={sendMessage}
        onPinMessage={pinMessage}
        onDeleteMessage={deleteMessage}
      />
      <Outlet />
    </div>
  );
}
