import { Drawer, Menu } from "antd";
import { useNavigation } from "hooks";
import { useNavigate } from "react-router-dom";

export function NavigationDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const navigation = useNavigation();

  return (
    <Drawer
      open={true}
      placement="left"
      onClose={onClose}
      style={{ position: "relative", top: 55 }}
    >
      <Menu
        mode="inline"
        items={navigation.map(({ to, title }) => ({
          key: to,
          label: title,
          onClick: () => {
            navigate(to);
            setTimeout(onClose, 250);
          },
        }))}
      />
    </Drawer>
  );
}
