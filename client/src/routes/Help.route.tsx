import { QuestionCircleOutlined } from "@ant-design/icons";
import { PageHeader } from "ui";

export function HelpRoute() {
  return (
    <>
      <PageHeader title="Help" icon={<QuestionCircleOutlined />} />
    </>
  );
}
