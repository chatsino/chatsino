import { Descriptions, Typography } from "antd";
import { ClientAvatarStrip } from "ui";

export function RoomReadonlyData({ room }: { room: ChatsinoRoom }) {
  return (
    <Descriptions
      bordered={true}
      layout="vertical"
      column={{ xs: 24, sm: 12, md: 8 }}
    >
      <Descriptions.Item label="ID">{room.id}</Descriptions.Item>
      <Descriptions.Item label="Created By">
        {room.owner && <ClientAvatarStrip client={room.owner} size="small" />}
        <Typography.Text type="secondary" style={{ display: "block" }}>
          {new Intl.DateTimeFormat("en-us", {
            timeStyle: "medium",
            dateStyle: "medium",
          }).format(new Date(room.createdAt))}
        </Typography.Text>
      </Descriptions.Item>
      <Descriptions.Item label="Updated By">
        <Typography.Text type="secondary" style={{ display: "block" }}>
          {new Intl.DateTimeFormat("en-us", {
            timeStyle: "medium",
            dateStyle: "medium",
          }).format(new Date(room.changedAt))}
        </Typography.Text>
      </Descriptions.Item>
    </Descriptions>
  );
}
