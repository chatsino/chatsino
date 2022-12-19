import { Descriptions } from "antd";
import { ChatroomAvatarStrip, ClientAvatarStrip } from "ui";

export function ChatroomReadonlyData({ chatroom }: { chatroom: ChatroomData }) {
  return (
    <Descriptions
      title={<ChatroomAvatarStrip chatroom={chatroom} size="large" />}
      bordered={true}
      layout="vertical"
      column={{ xs: 24, sm: 12, md: 8 }}
    >
      <Descriptions.Item label="ID">{chatroom.id}</Descriptions.Item>
      <Descriptions.Item label="Created By">
        <ClientAvatarStrip client={chatroom.createdBy} size="small" />
      </Descriptions.Item>
      <Descriptions.Item label="Updated By">
        <ClientAvatarStrip client={chatroom.updatedBy} size="small" />
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
  );
}
