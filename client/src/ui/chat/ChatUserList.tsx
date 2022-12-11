import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Divider, Input, List, Typography } from "antd";
import { toUniversalVh } from "helpers";

export function ChatUserList({ users }: { users: ChatUserData[] }) {
  const sortedUsers = users.sort((a, b) =>
    a.username.localeCompare(b.username)
  );

  return (
    <List
      itemLayout="vertical"
      bordered={true}
      dataSource={sortedUsers}
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
            <UserOutlined style={{ marginRight: "0.5rem" }} /> Users
          </span>
          <small>{users.length} online</small>
        </Typography.Title>
      }
      footer={
        <Input
          type="text"
          prefix={<SearchOutlined />}
          placeholder={`Search users`}
          value=""
          onChange={(event) => {}}
        />
      }
      renderItem={(item, index) => (
        <List.Item style={{ cursor: "pointer" }}>
          <List.Item.Meta
            avatar={<Avatar src={item.avatar} />}
            title={item.username}
          />
          {index !== users.length - 1 && <Divider style={{ margin: 0 }} />}
        </List.Item>
      )}
      style={{
        height: toUniversalVh(35),
        overflow: "auto",
      }}
    />
  );
}
