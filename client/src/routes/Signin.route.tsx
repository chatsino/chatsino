import { useAuthentication } from "hooks";
import { SigninForm } from "ui";

export function SigninRoute() {
  const { signin } = useAuthentication();

  return <SigninForm onSubmit={signin} />;
}
