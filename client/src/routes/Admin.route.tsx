import { SettingOutlined } from "@ant-design/icons";
import { PageHeader } from "ui";

export function AdminRoute() {
  return (
    <>
      <PageHeader title="Admin" icon={<SettingOutlined />} />
    </>
  );
}
