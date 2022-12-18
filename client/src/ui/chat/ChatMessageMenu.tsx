import { EllipsisOutlined } from "@ant-design/icons";
import { Button, Dropdown, Typography } from "antd";

export function ChatMessageMenu({
  message,
  onMention,
  onPin,
  onDelete,
}: {
  message: ChatMessageData;
  onMention: (username: string) => unknown;
  onPin: (messageId: number) => unknown;
  onDelete: (messageId: number) => unknown;
}) {
  return (
    <Typography.Text>
      <Dropdown
        menu={{
          items: [
            {
              key: "react",
              label: "React",
            },
            {
              key: "reply",
              label: "Reply",
            },
            {
              key: "mention",
              label: "Mention",
              onClick: () => onMention(message.author.username),
            },
            {
              key: "pin",
              label: message.pinned ? "Unpin" : "Pin",
              onClick: () => onPin(message.id),
            },
            {
              key: "edit",
              label: "Edit",
            },
            {
              key: "delete",
              label: <Typography.Text type="danger">Delete</Typography.Text>,
              onClick: () => onDelete(message.id),
            },
          ],
          onClick: (item) => console.info(item),
        }}
      >
        <Button
          type="text"
          icon={
            <Typography.Text>
              <EllipsisOutlined />
            </Typography.Text>
          }
        />
      </Dropdown>
    </Typography.Text>
  );
}
