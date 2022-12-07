import { Drawer } from "antd";

export function EmojiDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer open={true} placement="bottom" onClose={onClose}>
      (emoji)
    </Drawer>
  );
}
