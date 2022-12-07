import { Divider, Drawer, Menu } from "antd";
import { useClient } from "hooks";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

export function NavigationDrawer({
  navigation,
  onClose,
}: {
  navigation: Array<{ to: string; children: ReactNode }>;
  onClose: () => void;
}) {
  const { client } = useClient();

  return (
    <Drawer open={true} placement="left" onClose={onClose}>
      <Menu mode="inline">
        <Menu.ItemGroup>
          {navigation.map(({ to, children }) => (
            <Menu.Item key={to} onClick={() => setTimeout(onClose, 250)}>
              <Link to={to}>{children}</Link>
            </Menu.Item>
          ))}
        </Menu.ItemGroup>
        <Divider />
        <Menu.ItemGroup>
          {client ? (
            <Menu.Item>
              <Link to="/signout" onClick={onClose}>
                Sign out
              </Link>
            </Menu.Item>
          ) : (
            <>
              <Menu.Item>
                <Link to="/signin" onClick={onClose}>
                  Sign in
                </Link>
              </Menu.Item>
              <Menu.Item>
                <Link to="/signup" onClick={onClose}>
                  Sign up
                </Link>
              </Menu.Item>
            </>
          )}
        </Menu.ItemGroup>
      </Menu>
    </Drawer>
  );
}
