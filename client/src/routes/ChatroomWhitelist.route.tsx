import { useChatroomHeaderHeight, useUpdatingChatroom } from "hooks";
import { ChatroomSettingsLoaderData } from "loaders";
import { useLoaderData, useNavigate } from "react-router-dom";
import {
  Button,
  ChatroomAvatarStrip,
  CloseOutlined,
  Divider,
  Drawer,
  Space,
} from "ui";

export function ChatroomWhitelistRoute() {
  const { updateChatroom } = useLoaderData() as ChatroomSettingsLoaderData;
  const { chatroom } = useUpdatingChatroom();
  const navigate = useNavigate();
  const chatroomHeaderHeight = useChatroomHeaderHeight(chatroom.id);

  function handleClose() {
    return navigate(`/chat/${chatroom.id}/settings`);
  }

  return (
    <Drawer
      open={true}
      placement="right"
      title={
        <Space>
          <ChatroomAvatarStrip chatroom={chatroom} size="small" />
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
