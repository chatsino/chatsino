import { useAuthentication } from "hooks";
import { useEffect } from "react";

export function SignoutRoute() {
  const { signout } = useAuthentication();

  useEffect(() => {
    signout();
  }, [signout]);

  return <></>;
}
