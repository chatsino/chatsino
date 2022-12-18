import { Drawer, Menu, Typography } from "antd";
import { useNavigation } from "hooks";
import { useNavigate } from "react-router-dom";
import { CurrentClientStrip } from "../client";

export function NavigationDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const navigation = useNavigation();

  return (
    <Drawer
      open={true}
      placement="left"
      onClose={onClose}
      style={{
        position: "relative",
        top: 55,
        height: "calc(100vh - 55px)",
      }}
      footerStyle={{
        textAlign: "right",
      }}
      extra={<CurrentClientStrip />}
      footer={<Typography.Text>chatsino</Typography.Text>}
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
