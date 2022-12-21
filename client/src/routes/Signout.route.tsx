import { useAuthenticationRequests } from "hooks";
import { useEffect } from "react";

export function SignoutRoute() {
  const { signout } = useAuthenticationRequests();

  useEffect(() => {
    signout();
  }, [signout]);

  return <></>;
}
