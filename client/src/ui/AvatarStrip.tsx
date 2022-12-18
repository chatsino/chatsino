import { Avatar, Image, Space, Typography } from "antd";
import fallbackAvatar from "assets/fallback-avatar.png";
import { PropsWithChildren } from "react";

export type AvatarStripSize = "small" | "default" | "large";

export function AvatarStrip({
  size = "default",
  src,
  children,
}: PropsWithChildren<{
  size?: AvatarStripSize;
  src: string;
}>) {
  const sizeToTitleLevel: Record<AvatarStripSize, number> = {
    small: 5,
    default: 4,
    large: 3,
  };

  return (
    <Space>
      <Avatar
        src={<Image src={src} fallback={fallbackAvatar} />}
        size={size}
        style={{ marginRight: "0.5rem" }}
      />
      <Typography.Title
        level={sizeToTitleLevel[size] as 1 | 2 | 3 | 4 | 5}
        style={{ margin: 0 }}
      >
        {children}
      </Typography.Title>
    </Space>
  );
}
