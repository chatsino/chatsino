import { LogoutOutlined } from "@ant-design/icons";
import { Button, Divider, Space, Typography } from "antd";
import { useClient } from "hooks";
import { BiCoinStack } from "react-icons/bi";
import { Link } from "react-router-dom";
import { ClientAvatarStrip } from "./ClientAvatarStrip";

export function CurrentClientStrip() {
  const { client } = useClient();

  return client ? (
    <Space>
      <ClientAvatarStrip client={client} link="/me" size="small" />
      <Divider type="vertical" />
      <Typography.Text>
        <strong style={{ marginRight: "1rem" }}>Balance:</strong> {client.chips}{" "}
        <Typography.Text
          type="warning"
          style={{ position: "relative", top: 1 }}
        >
          <BiCoinStack />
        </Typography.Text>
      </Typography.Text>
      <Divider type="vertical" />
      <Link to="/signout">
        <Typography.Text type="secondary" style={{ marginRight: "0.25rem" }}>
          Sign out
        </Typography.Text>
        <Button type="text" icon={<LogoutOutlined />} size="small" />
      </Link>
    </Space>
  ) : (
    <Typography.Text>
      <Space>
        <Link to="/signin">Sign in</Link>
        or
        <Link to="/signup">Sign up</Link>
      </Space>
    </Typography.Text>
  );
}
