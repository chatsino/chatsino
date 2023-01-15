import { useRoomHeaderHeight, useUpdatingRoom } from "hooks";
import { RoomSettingsLoaderData } from "loaders";
import { Outlet, useLoaderData, useNavigate } from "react-router-dom";
import {
  Button,
  CloseOutlined,
  Divider,
  Drawer,
  Form,
  Grid,
  RoomAvatarStrip,
  RoomReadonlyData,
  Space,
  UpdateChatroomForm,
} from "ui";

export function RoomSettingsRoute() {
  const { updateRoom } = useLoaderData() as RoomSettingsLoaderData;
  const room = useUpdatingRoom();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const roomHeaderHeight = useRoomHeaderHeight(room.id);
  const { sm } = Grid.useBreakpoint();
  const isMobile = !sm;

  function handleClose() {
    return navigate(`/chat/${room.id}`);
  }

  return (
    <>
      <Drawer
        open={true}
        placement="right"
        title={
          <Space>
            <RoomAvatarStrip room={room} size="small" />
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
          top: roomHeaderHeight,
          height: `calc(100% - ${roomHeaderHeight}px)`,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <RoomReadonlyData room={room} />
          <UpdateChatroomForm
            form={form}
            room={room}
            onSubmit={updateRoom}
            onCancel={() => navigate(`/chat/${room.id}`)}
          />
        </Space>
      </Drawer>
      <Outlet />
    </>
  );
}
