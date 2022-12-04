import { Layout } from "antd";
import { Outlet } from "react-router-dom";

export function RootRoute() {
  return (
    <Layout>
      <Layout.Header>Header</Layout.Header>
      <Layout style={{ padding: 12 }}>
        <Outlet />
      </Layout>
    </Layout>
  );
}
