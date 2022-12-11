import {
  CodeOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Divider, Input, List, Tooltip, Typography } from "antd";
import { toUniversalVh } from "helpers";

export const CHATROOM_DESCRIPTION_TRUNCATION_LIMIT = 40;

export function ChatroomList({ chatrooms }: { chatrooms: ChatroomData[] }) {
  return (
    <List
      itemLayout="vertical"
      bordered={true}
      dataSource={chatrooms}
      header={
        <Typography.Title
          level={4}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 0 4px 0",
          }}
        >
          <span>
            <CodeOutlined style={{ marginRight: "0.5rem" }} /> Rooms
          </span>
          <span>
            <small style={{ marginRight: "0.5rem" }}>
              {chatrooms.length} total
            </small>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {}}
            />
          </span>
        </Typography.Title>
      }
      footer={
        <Input
          type="text"
          style={{
            marginTop: "1rem",
          }}
          prefix={<SearchOutlined />}
          placeholder={`Search rooms`}
          value=""
          onChange={(event) => {}}
        />
      }
      renderItem={(item, index) => {
        const truncatedDescription =
          item.description.length >= CHATROOM_DESCRIPTION_TRUNCATION_LIMIT
            ? item.description.slice(0, CHATROOM_DESCRIPTION_TRUNCATION_LIMIT) +
              "..."
            : item.description;

        return (
          <List.Item
            style={{ cursor: "pointer" }}
            extra={
              <Typography.Text>
                {item.users.length} <UserOutlined />
              </Typography.Text>
            }
          >
            <Tooltip title={item.description}>
              <List.Item.Meta
                title={item.title}
                description={truncatedDescription}
              />
            </Tooltip>
            {index !== chatrooms.length - 1 && (
              <Divider style={{ margin: 0 }} />
            )}
          </List.Item>
        );
      }}
      style={{
        height: toUniversalVh(35),
        overflow: "auto",
      }}
    />
  );
}
