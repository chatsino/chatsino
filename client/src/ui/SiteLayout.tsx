import {
  MenuOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Layout, Typography, theme, Space } from "antd";
import { ReactNode, useState } from "react";
import { NavigationDrawer, UserListDrawer } from "./drawers";

export function SiteLayout({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation: Array<{ to: string; children: ReactNode }>;
}) {
  const [showingNavigation, setShowingNavigation] = useState(false);
  const [showingSearch, setShowingSearch] = useState(false);
  const [showingUsers, setShowingUsers] = useState(false);
  const MenuIcon = showingNavigation ? MenuUnfoldOutlined : MenuOutlined;

  function toggleNavigation() {
    return setShowingNavigation((prev) => !prev);
  }

  function closeNavigation() {
    return setShowingNavigation(false);
  }

  function toggleUsers() {
    return setShowingUsers((prev) => !prev);
  }

  function closeUsers() {
    return setShowingUsers(false);
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
      }}
    >
      <Layout>
        <Layout.Header
          style={{
            paddingInline: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Button
              type="text"
              icon={<MenuIcon style={{ color: "#f5f5f5" }} />}
              style={{ marginRight: "1rem" }}
              onClick={toggleNavigation}
            />
            <Typography.Title level={3} style={{ margin: 0 }}>
              # chatsino
            </Typography.Title>
          </Space>
          <Space>
            <Button
              type="text"
              icon={<SearchOutlined style={{ color: "#f5f5f5" }} />}
            />
            <Button
              type="text"
              icon={<UserOutlined style={{ color: "#f5f5f5" }} />}
              onClick={toggleUsers}
            />
          </Space>
        </Layout.Header>
        <Layout style={{ padding: 12, minHeight: "100vh" }}>{children}</Layout>
      </Layout>
      {showingNavigation && (
        <NavigationDrawer navigation={navigation} onClose={closeNavigation} />
      )}
      {showingUsers && <UserListDrawer onClose={closeUsers} />}
    </ConfigProvider>
  );
}
