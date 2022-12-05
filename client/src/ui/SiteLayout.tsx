import { Layout } from "antd";
import { ReactNode } from "react";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <Layout>
      <Layout.Header>Header</Layout.Header>
      <Layout style={{ padding: 12 }}>{children}</Layout>
    </Layout>
  );
}
