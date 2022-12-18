import { Space } from "antd";
import { useUpdatingChatroom } from "hooks";
import { ChatroomSettingsLoaderData } from "loaders";
import { BsDoorOpen } from "react-icons/bs";
import { useLoaderData, useNavigate } from "react-router-dom";
import { ChatroomReadonlyData, PageHeader, UpdateChatroomForm } from "ui";

export function ChatroomSettingsRoute() {
  const { updateChatroom } = useLoaderData() as ChatroomSettingsLoaderData;
  const { chatroom } = useUpdatingChatroom();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Chatroom Settings" icon={<BsDoorOpen />} />
      <Space
        style={{ width: "100%", justifyContent: "center", paddingTop: "2rem" }}
      >
        <Space direction="vertical">
          <ChatroomReadonlyData chatroom={chatroom} />
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
