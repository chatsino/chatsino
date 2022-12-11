import { MenuOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CurrentClientStrip } from "./CurrentClientStrip";
import { NavigationDrawer } from "./drawers";

export function SiteHeader() {
  const [showingNavigationDrawer, setShowingNavigationDrawer] = useState(false);
  const MenuIcon = showingNavigationDrawer ? MenuUnfoldOutlined : MenuOutlined;
  const location = useLocation();

  function closeNavigationDrawer() {
    return setShowingNavigationDrawer(false);
  }

  function toggleNavigationDrawer() {
    return setShowingNavigationDrawer((prev) => !prev);
  }

  useEffect(() => {
    closeNavigationDrawer();
  }, [location]);

  return (
    <>
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
        <CurrentClientStrip />
      </Layout.Header>
      {showingNavigationDrawer && (
        <NavigationDrawer onClose={closeNavigationDrawer} />
      )}
    </>
  );
}
