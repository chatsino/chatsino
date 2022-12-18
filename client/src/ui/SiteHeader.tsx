import {
  BarChartOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Button, Divider, Layout, Menu, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useMatches } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { CurrentClientStrip } from "./client";
import { NavigationDrawer } from "./drawers";

export const BUTTON_LINKS = [
  {
    key: "/help",
    label: (
      <Link to="/help">
        <Space>
          Help <QuestionCircleOutlined />
        </Space>
      </Link>
    ),
  },
  {
    key: "/stats",
    label: (
      <Link to="/stats">
        <Space>
          Stats <BarChartOutlined />
        </Space>
      </Link>
    ),
  },
  {
    key: "/admin",
    label: (
      <Link to="/admin">
        <Space>
          Admin <SettingOutlined />
        </Space>
      </Link>
    ),
  },
];

export function SiteHeader() {
  const [showingNavigationDrawer, setShowingNavigationDrawer] = useState(false);
  const MenuIcon = showingNavigationDrawer ? MenuUnfoldOutlined : MenuOutlined;
  const location = useLocation();
  const matches = useMatches();
  const routeMatch = BUTTON_LINKS.find((link) =>
    matches.find((match) => match.pathname === link.key)
  );

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
        <Space size="large">
          <Button
            type="text"
            icon={<MenuIcon style={{ color: "#f5f5f5" }} />}
            style={{ marginRight: "1rem" }}
            onClick={toggleNavigationDrawer}
          />
          <Typography.Title level={3} style={{ margin: 0 }}>
            chatsino
          </Typography.Title>
          <Divider type="vertical" />
          <Menu
            mode="horizontal"
            theme="dark"
            activeKey={routeMatch?.key}
            items={BUTTON_LINKS}
          />
        </Space>
        <CurrentClientStrip />
      </Layout.Header>
      {showingNavigationDrawer && (
        <NavigationDrawer onClose={closeNavigationDrawer} />
      )}
    </>
  );
}
