import { Button, Space, Typography } from "antd";
import { useAuthentication } from "hooks";
import { SigninForm } from "ui";
import { Link } from "react-router-dom";

export function SigninRoute() {
  const { signin } = useAuthentication();

  return (
    <Space direction="vertical">
      <Button.Group style={{ width: "100%" }}>
        <Button type="primary" block={true}>
          Sign in
        </Button>
        <Link to="/signup" style={{ width: "100%" }}>
          <Button block={true}>Sign up</Button>
        </Link>
      </Button.Group>
      <Typography.Title level={2}>Sign in</Typography.Title>
      <SigninForm onSubmit={signin} />
    </Space>
  );
}
