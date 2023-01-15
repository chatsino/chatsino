import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Input, List, Typography } from "antd";
import { Link } from "react-router-dom";

export function ChatUserList({ users }: { users: ChatsinoUser[] }) {
  const sorted = users
    .sort((a, b) => a.username.localeCompare(b.username))
    .map((each) => ({
      ...each,
      active: true,
    }));

  return (
    <List
      id="ChatUserList"
      itemLayout="vertical"
      bordered={true}
      dataSource={sorted}
      size="small"
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
          <small>{sorted.length} online</small>
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
      renderItem={(item) => (
        <Link to={`/u/${item.id}`}>
          <List.Item style={{ cursor: "pointer" }}>
            <List.Item.Meta
              avatar={<Avatar src={item.avatar} />}
              title={item.username}
            />
          </List.Item>
        </Link>
      )}
      style={{
        flex: 1,
        marginBottom: "1rem",
      }}
    />
  );
}
