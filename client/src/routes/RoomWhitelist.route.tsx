import { useRoomHeaderHeight, useUpdatingRoom } from "hooks";
import { useNavigate } from "react-router-dom";
import {
  Button,
  CloseOutlined,
  Divider,
  Drawer,
  RoomAvatarStrip,
  Space,
} from "ui";

export function RoomWhitelistRoute() {
  const room = useUpdatingRoom();
  const navigate = useNavigate();
  const chatroomHeaderHeight = useRoomHeaderHeight(room.id);

  function handleClose() {
    return navigate(`/chat/${room.id}/settings`);
  }

  return (
    <Drawer
      open={true}
      placement="right"
      title={
        <Space>
          <RoomAvatarStrip room={room} size="small" />
          <Divider type="vertical" />
          Whitelist
        </Space>
      }
      extra={
        <Button icon={<CloseOutlined />} onClick={handleClose}>
          Close
        </Button>
      }
      getContainer={false}
      style={{
        position: "relative",
        top: chatroomHeaderHeight,
        height: `calc(100% - ${chatroomHeaderHeight}px)`,
      }}
    >
      Whitelist
    </Drawer>
  );
}
