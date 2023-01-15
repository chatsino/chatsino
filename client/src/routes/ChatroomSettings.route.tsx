import { useRoomHeaderHeight, useUpdatingRoom } from "hooks";
import { RoomSettingsLoaderData } from "loaders";
import { Outlet, useLoaderData, useNavigate } from "react-router-dom";
import {
  Button,
  ChatroomAvatarStrip,
  ChatroomReadonlyData,
  CloseOutlined,
  Divider,
  Drawer,
  Form,
  Grid,
  Space,
  UpdateChatroomForm,
} from "ui";

export function ChatroomSettingsRoute() {
  const { updateChatroom } = useLoaderData() as RoomSettingsLoaderData;
  const { chatroom } = useUpdatingRoom();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const chatroomHeaderHeight = useRoomHeaderHeight(chatroom.id);
  const { sm } = Grid.useBreakpoint();
  const isMobile = !sm;

  function handleClose() {
    return navigate(`/chat/${chatroom.id}`);
  }

  return (
    <>
      <Drawer
        open={true}
        placement="right"
        title={
          <Space>
            <ChatroomAvatarStrip chatroom={chatroom} size="small" />
            <Divider type="vertical" />
            Settings
          </Space>
        }
        extra={
          <Button icon={<CloseOutlined />} onClick={handleClose}>
            Close
          </Button>
        }
        footer={
          <Space style={{ float: "right" }}>
            <Button type="text" size="large" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="primary" size="large" onClick={form.submit}>
              Update
            </Button>
          </Space>
        }
        onClose={handleClose}
        getContainer={false}
        width={isMobile ? "100%" : "50%"}
        style={{
          position: "relative",
          top: chatroomHeaderHeight,
          height: `calc(100% - ${chatroomHeaderHeight}px)`,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <ChatroomReadonlyData chatroom={chatroom} />
          <UpdateChatroomForm
            form={form}
            chatroom={chatroom}
            onSubmit={updateChatroom}
            onCancel={() => navigate(`/chat/${chatroom.id}`)}
          />
        </Space>
      </Drawer>
      <Outlet />
    </>
  );
}
