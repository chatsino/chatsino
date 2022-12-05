import { MenuOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Button, Layout } from "antd";
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
    <>
      <Layout>
        <Layout.Header style={{ paddingInline: 12, textAlign: "right" }}>
          <Button
            type="text"
            icon={<MenuIcon style={{ color: "#f5f5f5" }} />}
            onClick={toggleMenu}
          />
        </Layout.Header>
        <Layout style={{ padding: 12 }}>{children}</Layout>
      </Layout>
      {showingMenu && (
        <NavigationDrawer navigation={navigation} onClose={closeMenu} />
      )}
    </>
  );
}
