import { MenuOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Layout, Typography, theme, Space } from "antd";
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { NavigationDrawer } from "./drawers";

export function SiteLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [showingNavigationDrawer, setShowingNavigationDrawer] = useState(false);
  const MenuIcon = showingNavigationDrawer ? MenuUnfoldOutlined : MenuOutlined;

  function toggleNavigationDrawer() {
    return setShowingNavigationDrawer((prev) => !prev);
  }

  function closeNavigationDrawer() {
    return setShowingNavigationDrawer(false);
  }

  useEffect(() => {
    closeNavigationDrawer();
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
            <Typography.Title level={3} style={{ margin: 0 }}>
              chatsino
            </Typography.Title>
          </Space>
        </Layout.Header>
        <Layout style={{ padding: "12px 1rem", minHeight: "100vh" }}>
          {children}
        </Layout>
      </Layout>
      {showingNavigationDrawer && (
        <NavigationDrawer onClose={closeNavigationDrawer} />
      )}
    </ConfigProvider>
  );
}
