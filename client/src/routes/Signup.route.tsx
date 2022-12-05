import { useAuthentication } from "hooks";
import { SignupForm } from "ui";

export function SignupRoute() {
  const { signup } = useAuthentication();

  return <SignupForm onSubmit={signup} />;
}
