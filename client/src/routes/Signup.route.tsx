import { Col, Row, Typography } from "antd";
import { useAuthenticationRequests } from "hooks";
import { Link } from "react-router-dom";
import { SignupForm } from "ui";

export function SignupRoute() {
  const { signup } = useAuthenticationRequests();

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
          <span>Sign up</span>
          <small style={{ fontSize: 18 }}>
            ...or <Link to="/signin">sign in.</Link>
          </small>
        </Typography.Title>
        <SignupForm onSubmit={signup} />
      </Col>
    </Row>
  );
}
