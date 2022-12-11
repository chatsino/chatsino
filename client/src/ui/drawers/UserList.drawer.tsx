import { Drawer } from "antd";

export function UserListDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer
      open={true}
      placement="right"
      onClose={onClose}
      getContainer={false}
    >
      (user list)
    </Drawer>
  );
}
