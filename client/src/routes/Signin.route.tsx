import { Col, Row, Typography } from "antd";
import { useAuthentication } from "hooks";
import { Link } from "react-router-dom";
import { SigninForm } from "ui";

export function SigninRoute() {
  const { signin } = useAuthentication();

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
        <SigninForm onSubmit={signin} />
      </Col>
    </Row>
  );
}
