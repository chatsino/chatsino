import { Typography } from "antd";
import { ReactNode } from "react";

export function PageHeader({
  title,
  icon,
}: {
  title: ReactNode;
  icon: ReactNode;
}) {
  return (
    <Typography.Title
      level={2}
      style={{
        display: "flex",
        alignItems: "center",
        textTransform: "uppercase",
        letterSpacing: 3,
      }}
    >
      {icon}
      <span style={{ marginLeft: "1rem" }}>{title}</span>
    </Typography.Title>
  );
}
