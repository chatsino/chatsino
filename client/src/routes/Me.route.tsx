import { LogoutOutlined } from "@ant-design/icons";
import { Button } from "ui";
import { Link } from "react-router-dom";

export function MeRoute() {
  return (
    <div>
      <Link to="/signout">
        <Button icon={<LogoutOutlined />} block={true}>
          Sign out
        </Button>
      </Link>
    </div>
  );
}
