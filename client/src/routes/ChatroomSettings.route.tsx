import { CloseOutlined } from "@ant-design/icons";
import { Button, Divider, Drawer, Form, Grid, Space } from "antd";
import { useUpdatingChatroom } from "hooks";
import { ChatroomSettingsLoaderData } from "loaders";
import { useEffect, useState } from "react";
import { Outlet, useLoaderData, useNavigate } from "react-router-dom";
import {
  ChatroomAvatarStrip,
  ChatroomReadonlyData,
  UpdateChatroomForm,
} from "ui";

export function ChatroomSettingsRoute() {
  const { updateChatroom } = useLoaderData() as ChatroomSettingsLoaderData;
  const { chatroom } = useUpdatingChatroom();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [distanceFromTop, setDistanceFromTop] = useState(0);
  const { sm } = Grid.useBreakpoint();
  const isMobile = !sm;

  function handleClose() {
    return navigate(`/chat/${chatroom.id}`);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const chatroomHeader = document.getElementById(
      `ChatroomHeader#${chatroom.id}`
    )?.parentElement;

    if (chatroomHeader) {
      const chatroomHeaderHeight = parseInt(
        getComputedStyle(chatroomHeader).height
      );

      if (chatroomHeaderHeight !== distanceFromTop) {
        setDistanceFromTop(chatroomHeaderHeight);
      }
    }
  });

  return (
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
        top: distanceFromTop,
        height: `calc(100% - ${distanceFromTop}px)`,
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
      <Outlet />
    </Drawer>
  );
}
