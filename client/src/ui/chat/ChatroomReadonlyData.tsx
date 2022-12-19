import { Descriptions, Typography } from "antd";
import { ClientAvatarStrip } from "ui";

export function ChatroomReadonlyData({ chatroom }: { chatroom: ChatroomData }) {
  return (
    <Descriptions
      bordered={true}
      layout="vertical"
      column={{ xs: 24, sm: 12, md: 8 }}
    >
      <Descriptions.Item label="ID">{chatroom.id}</Descriptions.Item>
      <Descriptions.Item label="Created By">
        <ClientAvatarStrip client={chatroom.createdBy} size="small" />
        <Typography.Text type="secondary" style={{ display: "block" }}>
          {new Intl.DateTimeFormat("en-us", {
            timeStyle: "medium",
            dateStyle: "medium",
          }).format(new Date(chatroom.createdAt))}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Updated By">
        <ClientAvatarStrip client={chatroom.updatedBy} size="small" />
        <Typography.Text type="secondary" style={{ display: "block" }}>
          {new Intl.DateTimeFormat("en-us", {
            timeStyle: "medium",
            dateStyle: "medium",
          }).format(new Date(chatroom.updatedAt))}
        </Typography.Text>
      </Descriptions.Item>
    </Descriptions>
  );
}
