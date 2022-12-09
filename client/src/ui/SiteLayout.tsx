import {
  MenuOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Layout, Typography, theme, Space } from "antd";
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChatroomDrawer, NavigationDrawer, UserListDrawer } from "./drawers";

export function SiteLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showingNavigationDrawer, setShowingNavigationDrawer] = useState(false);
  const [showingChatroomDrawer, setShowingChatroomDrawer] = useState(false);
  const [showingUsersDrawer, setShowingUsersDrawer] = useState(false);
  const MenuIcon = showingNavigationDrawer ? MenuUnfoldOutlined : MenuOutlined;

  function toggleNavigationDrawer() {
    return setShowingNavigationDrawer((prev) => !prev);
  }

  function closeNavigationDrawer() {
    return setShowingNavigationDrawer(false);
  }

  function toggleChatroomDrawer() {
    return setShowingChatroomDrawer((prev) => !prev);
  }

  function closeChatroomDrawer() {
    return setShowingChatroomDrawer(false);
  }

  function toggleUsersDrawer() {
    return setShowingUsersDrawer((prev) => !prev);
  }

  function closeUsersDrawer() {
    return setShowingUsersDrawer(false);
  }

  useEffect(() => {
    for (const closeDrawer of [
      closeNavigationDrawer,
      closeChatroomDrawer,
      closeUsersDrawer,
    ]) {
      closeDrawer();
    }
  }, [location]);

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
              onClick={toggleNavigationDrawer}
            />
            <Button type="text" onClick={toggleChatroomDrawer}>
              <Typography.Title level={3}># chatsino</Typography.Title>
            </Button>
          </Space>
          <Space>
            <Button
              type="text"
              icon={<SearchOutlined style={{ color: "#f5f5f5" }} />}
            />
            <Button
              type="text"
              icon={<UserOutlined style={{ color: "#f5f5f5" }} />}
              onClick={toggleUsersDrawer}
            />
          </Space>
        </Layout.Header>
        <Layout style={{ padding: "12px 1rem", minHeight: "100vh" }}>
          {children}
        </Layout>
      </Layout>
      {showingNavigationDrawer && (
        <NavigationDrawer onClose={closeNavigationDrawer} />
      )}
      {showingChatroomDrawer && (
        <ChatroomDrawer onClose={closeChatroomDrawer} />
      )}
      {showingUsersDrawer && <UserListDrawer onClose={closeUsersDrawer} />}
    </ConfigProvider>
  );
}
