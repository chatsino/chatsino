import { Drawer } from "antd";

export function UserListDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer
      open={true}
      placement="right"
      onClose={onClose}
      style={{ position: "relative", top: 55 }}
    >
      (user list)
    </Drawer>
  );
}
