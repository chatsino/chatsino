import { Button, Space, Typography } from "antd";
import { useAuthentication } from "hooks";
import { Link } from "react-router-dom";
import { SignupForm } from "ui";

export function SignupRoute() {
  const { signup } = useAuthentication();

  return (
    <Space direction="vertical">
      <Button.Group style={{ width: "100%" }}>
        <Link to="/signin" style={{ width: "100%" }}>
          <Button block={true}>Sign in</Button>
        </Link>
        <Button type="primary" block={true}>
          Sign up
        </Button>
      </Button.Group>
      <Typography.Title level={2}>Sign up</Typography.Title>
      <SignupForm onSubmit={signup} />
    </Space>
  );
}
