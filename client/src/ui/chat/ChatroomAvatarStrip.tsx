import { Link } from "react-router-dom";
import { AvatarStrip, AvatarStripSize } from "../AvatarStrip";

export function ChatroomAvatarStrip({
  chatroom: { id, avatar, title },
  link,
  size = "default",
}: {
  chatroom: ChatroomData;
  link?: string;
  size?: AvatarStripSize;
}) {
  link = link ?? `/chat/${id}`;

  return (
    <Link to={link}>
      <AvatarStrip src={avatar} size={size}>
        {title}
      </AvatarStrip>
    </Link>
  );
}
