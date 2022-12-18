import { Descriptions, Divider, Space } from "antd";
import { ChatroomSettingsLoaderData } from "loaders";
import { BsDoorOpen } from "react-icons/bs";
import { useLoaderData, useNavigate } from "react-router-dom";
import { InlineClient, PageHeader, UpdateChatroomForm } from "ui";

export function ChatroomSettingsRoute() {
  const { chatroom, updateChatroom } =
    useLoaderData() as ChatroomSettingsLoaderData;
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Chatroom Settings" icon={<BsDoorOpen />} />
      <Space
        style={{ width: "100%", justifyContent: "center", paddingTop: "2rem" }}
      >
        <Space direction="vertical">
          <Descriptions
            title={
              <Divider orientation="left">
                <InlineClient
                  client={{
                    id: chatroom.id,
                    avatar: chatroom.avatar,
                    username: chatroom.title,
                  }}
                />
              </Divider>
            }
            bordered={true}
            layout="vertical"
            column={{ xs: 24, sm: 12, md: 8 }}
          >
            <Descriptions.Item label="ID">{chatroom.id}</Descriptions.Item>
            <Descriptions.Item label="Created By">
              <InlineClient client={chatroom.createdBy} />
            </Descriptions.Item>
            <Descriptions.Item label="Updated By">
              <InlineClient client={chatroom.updatedBy} />
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Intl.DateTimeFormat("en-us", {
                timeStyle: "medium",
                dateStyle: "medium",
              }).format(new Date(chatroom.createdAt))}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {new Intl.DateTimeFormat("en-us", {
                timeStyle: "medium",
                dateStyle: "medium",
              }).format(new Date(chatroom.updatedAt))}
            </Descriptions.Item>
          </Descriptions>
          <UpdateChatroomForm
            chatroom={chatroom}
            onSubmit={updateChatroom}
            onCancel={() => navigate(`/chat/${chatroom.id}`)}
          />
        </Space>
      </Space>
    </>
  );
}
