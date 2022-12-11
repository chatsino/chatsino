import { ConfigProvider, Layout, theme } from "antd";
import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
      }}
    >
      <Layout>
        <SiteHeader />
        <Layout style={{ padding: "12px 1rem", minHeight: "100vh" }}>
          {children}
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
