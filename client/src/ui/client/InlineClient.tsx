import { Avatar, Typography } from "antd";
import { Link } from "react-router-dom";

export function InlineClient({
  client,
  link,
}: {
  client: ChatUserData;
  link?: string;
}) {
  return (
    <Link
      to={link ?? `/users/${client.id}`}
      style={{ display: "flex", alignItems: "center" }}
    >
      <Avatar
        size="small"
        src={client.avatar}
        style={{ marginRight: "0.5rem" }}
      />
      <Typography.Title level={5} style={{ margin: 0 }}>
        {client.username}
      </Typography.Title>
    </Link>
  );
}
