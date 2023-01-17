import { Drawer } from "antd";
import { ChatUserList } from "../chat";

export function UserListDrawer({
  onClose,
  users,
}: {
  onClose: () => void;
  users: ChatsinoUser[];
}) {
  return (
    <Drawer
      open={true}
      placement="right"
      onClose={onClose}
      getContainer={false}
    >
      <ChatUserList users={users} />
    </Drawer>
  );
}
