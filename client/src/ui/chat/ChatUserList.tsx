import { UserOutlined } from "@ant-design/icons";
import { Avatar, Divider, List, Typography } from "antd";
import { toUniversalVh } from "helpers";

export function ChatUserList({ users }: { users: ChatUserData[] }) {
  return (
    <List
      itemLayout="vertical"
      bordered={true}
      dataSource={users}
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
        height: toUniversalVh(80),
        overflow: "auto",
      }}
    />
  );
}
