import { Col, Row, Typography } from "antd";
import { useAuthentication } from "hooks";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SigninForm } from "ui";

export function SigninRoute() {
  const { signin } = useAuthentication();
  const { search } = useLocation();
  const navigate = useNavigate();
  const redirectRoute = new URLSearchParams(search).get("redirect") ?? "/me";

  async function handleSignin(username: string, password: string) {
    await signin(username, password);

    navigate(redirectRoute);
  }

  return (
    <Row>
      <Col
        xs={24}
        sm={{
          span: 16,
          push: 4,
        }}
        lg={{
          span: 12,
          push: 6,
        }}
      >
        <Typography.Title
          level={1}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "3rem",
            marginBottom: "3rem",
          }}
        >
          <span>Sign in</span>
          <small style={{ fontSize: 18 }}>
            ...or <Link to="/signup">sign up.</Link>
          </small>
        </Typography.Title>
        <SigninForm onSubmit={handleSignin} />
      </Col>
    </Row>
  );
}
