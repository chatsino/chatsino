import {
  MenuOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Layout, Typography, theme, Space } from "antd";
import { ReactNode, useState } from "react";
import { NavigationDrawer } from "./drawers";

export function SiteLayout({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation: Array<{ to: string; children: ReactNode }>;
}) {
  const [showingMenu, setShowingMenu] = useState(false);
  const MenuIcon = showingMenu ? MenuUnfoldOutlined : MenuOutlined;

  function toggleMenu() {
    return setShowingMenu((prev) => !prev);
  }

  function closeMenu() {
    return setShowingMenu(false);
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
              onClick={toggleMenu}
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
            />
          </Space>
        </Layout.Header>
        <Layout style={{ padding: 12, minHeight: "100vh" }}>{children}</Layout>
      </Layout>
      {showingMenu && (
        <NavigationDrawer navigation={navigation} onClose={closeMenu} />
      )}
    </ConfigProvider>
  );
}
