import { useUpdatingRoom } from "hooks";
import { RoomLoaderData } from "loaders";
import { Outlet, useLoaderData } from "react-router-dom";
import { Room } from "ui";

export function ChatroomRoute() {
  const { sendMessage, pinMessage, deleteMessage } =
    useLoaderData() as RoomLoaderData;
  const room = useUpdatingRoom();

  return (
    <div style={{ position: "relative" }}>
      <Room
        id="chat"
        room={room}
        onSendMessage={sendMessage}
        onPinMessage={pinMessage}
        onDeleteMessage={deleteMessage}
      />
      <Outlet />
    </div>
  );
}
