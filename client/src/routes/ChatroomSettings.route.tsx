import { LockOutlined, SettingOutlined } from "@ant-design/icons";
import { Col, Row, Space, Typography } from "antd";
import { useUpdatingChatroom } from "hooks";
import { ChatroomSettingsLoaderData } from "loaders";
import { useLoaderData, useNavigate } from "react-router-dom";
import { ChatroomReadonlyData, PageHeader, UpdateChatroomForm } from "ui";

export function ChatroomSettingsRoute() {
  const { updateChatroom } = useLoaderData() as ChatroomSettingsLoaderData;
  const { chatroom } = useUpdatingChatroom();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Chatroom Settings" icon={<SettingOutlined />} />
      <Row gutter={40}>
        <Col xs={24} sm={18}>
          <Space direction="vertical" size="large">
            <ChatroomReadonlyData chatroom={chatroom} />
            <UpdateChatroomForm
              chatroom={chatroom}
              onSubmit={updateChatroom}
              onCancel={() => navigate(`/chat/${chatroom.id}`)}
            />
          </Space>
        </Col>
        <Col xs={24} sm={6}>
          <Typography.Title level={2} style={{ textAlign: "right" }}>
            Security <LockOutlined />
          </Typography.Title>
        </Col>
      </Row>
    </>
  );
}
