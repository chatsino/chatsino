import { Drawer } from "antd";

export function ChatroomDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer
      open={true}
      placement="top"
      onClose={onClose}
      style={{ position: "relative", top: 55 }}
    >
      (chatroom)
    </Drawer>
  );
}
