import { LogoutOutlined } from "@ant-design/icons";
import { Button, Drawer, Menu, Space, Typography } from "antd";
import { useClient, useNavigation } from "hooks";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function NavigationDrawer({ onClose }: { onClose: () => void }) {
  const { client } = useClient();
  const navigate = useNavigate();
  const navigation = useNavigation();

  return (
    <Drawer
      open={true}
      placement="left"
      onClose={onClose}
      style={{
        position: "relative",
        top: 55,
        height: "calc(100vh - 55px)",
      }}
      footerStyle={{
        textAlign: "right",
      }}
      extra={
        <Typography.Text>
          {client ? (
            <Space>
              <span>hello,</span> <Link to="/me">@{client.username}</Link>
              <Link to="/signout">
                <Button type="text" icon={<LogoutOutlined />} />
              </Link>
            </Space>
          ) : (
            <Space>
              <Link to="/signin">sign in</Link>
              <span>or</span>
              <Link to="/signup">sign up</Link>
            </Space>
          )}
        </Typography.Text>
      }
      footer={<Typography.Text>chatsino</Typography.Text>}
    >
      <Menu
        mode="inline"
        items={navigation.map(({ to, title }) => ({
          key: to,
          label: title,
          onClick: () => {
            navigate(to);
            setTimeout(onClose, 250);
          },
        }))}
      />
    </Drawer>
  );
}
