import { Drawer } from "antd";

export function EmojiDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer open={true} mask={false} placement="bottom" onClose={onClose}>
      (emoji)
    </Drawer>
  );
}
