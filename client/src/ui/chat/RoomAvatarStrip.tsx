import { Typography } from "antd";
import { Link } from "react-router-dom";
import { AvatarStrip, AvatarStripSize } from "../AvatarStrip";

export function RoomAvatarStrip({
  room: { id, avatar, title },
  link = "",
  size = "default",
  active = false,
}: {
  room: ChatsinoRoom;
  link?: string | false;
  size?: AvatarStripSize;
  active?: boolean;
}) {
  const isSmall = size === "small";
  const strip = (
    <AvatarStrip src={avatar} size={size}>
      <Typography.Text
        type={active ? "warning" : "secondary"}
        style={{
          fontSize: isSmall ? 14 : 20,
        }}
      >
        #
      </Typography.Text>
      <Typography.Text
        type={active ? "warning" : undefined}
        style={{
          position: "relative",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontSize: isSmall ? 12 : 18,
          ...(isSmall
            ? {
                left: 3,
                bottom: 1,
              }
            : {
                left: 4,
                bottom: 2,
              }),
        }}
      >
        {title}
      </Typography.Text>
    </AvatarStrip>
  );

  if (typeof link === "string") {
    link = link || `/chat/${id}`;

    return <Link to={link}>{strip}</Link>;
  } else {
    return strip;
  }
}
