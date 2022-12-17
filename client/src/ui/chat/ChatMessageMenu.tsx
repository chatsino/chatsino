import { EllipsisOutlined } from "@ant-design/icons";
import { Button, Dropdown, Typography } from "antd";

export function ChatMessageMenu({
  message,
  onDelete,
}: {
  message: ChatMessageData;
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
