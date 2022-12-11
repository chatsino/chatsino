import { Drawer } from "antd";

export function EmojiDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer
      open={true}
      mask={false}
      placement="bottom"
      getContainer={false}
      onClose={onClose}
    >
      (emoji)
    </Drawer>
  );
}
