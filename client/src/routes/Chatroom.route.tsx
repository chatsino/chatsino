import { useChatroomEntranceExit, useUpdatingChatroom } from "hooks";
import { RoomLoaderData } from "loaders";
import { Outlet, useLoaderData } from "react-router-dom";
import { Chatroom } from "ui";

export function ChatroomRoute() {
  const { sendMessage, pinMessage, deleteMessage } =
    useLoaderData() as RoomLoaderData;
  const { chatroom, messages } = useUpdatingChatroom();

  useChatroomEntranceExit(chatroom.id);

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
