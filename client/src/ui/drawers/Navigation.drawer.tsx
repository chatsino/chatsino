import { Divider, Drawer, Menu } from "antd";
import { useClient } from "hooks";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

export function NavigationDrawer({
  navigation,
  onClose,
}: {
  navigation: Array<{ to: string; title: ReactNode }>;
  onClose: () => void;
}) {
  const { client } = useClient();

  return (
    <Drawer
      open={true}
      placement="left"
      onClose={onClose}
      style={{ position: "relative", top: 55 }}
    >
      <Menu mode="inline">
        <Menu.ItemGroup>
          {navigation.map(({ to, title }) => (
            <Menu.Item key={to} onClick={() => setTimeout(onClose, 250)}>
              <Link to={to}>{title}</Link>
            </Menu.Item>
          ))}
        </Menu.ItemGroup>
      </Menu>
    </Drawer>
  );
}
