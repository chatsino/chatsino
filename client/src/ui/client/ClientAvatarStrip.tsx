import { Link } from "react-router-dom";
import { AvatarStrip, AvatarStripSize } from "../AvatarStrip";

export function ClientAvatarStrip({
  client: { id, avatar, username },
  link = "",
  size = "default",
}: {
  client: ChatUserData;
  link?: string | false;
  size?: AvatarStripSize;
}) {
  const strip = (
    <AvatarStrip src={avatar} size={size}>
      {username}
    </AvatarStrip>
  );

  if (typeof link === "string") {
    link = link ?? `/users/${id}`;

    return <Link to={link}>{strip}</Link>;
  } else {
    return strip;
  }
}
