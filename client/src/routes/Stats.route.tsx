import { BarChartOutlined } from "@ant-design/icons";
import { PageHeader } from "ui";

export function StatsRoute() {
  return (
    <>
      <PageHeader title="Stats" icon={<BarChartOutlined />} />
    </>
  );
}
