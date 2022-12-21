import { Drawer } from "antd";
import { ChatUserList } from "../chat";

export function UserListDrawer({
  onClose,
  users,
}: {
  onClose: () => void;
  users: ChatUserData[];
}) {
  return (
    <Drawer
      open={true}
      placement="right"
      onClose={onClose}
      getContainer={false}
    >
      <ChatUserList active={[]} inactive={[]} />
    </Drawer>
  );
}
