import { useCallback, useMemo } from "react";
import { makeHttpRequest } from "helpers";
import { SafeClient } from "schemas";

export function useAuthentication() {
  const validate = useCallback(async () => {
    try {
      const { client } = await makeHttpRequest<{
        client: SafeClient;
      }>("get", "/auth/validate");

      return client;
    } catch (error) {
      console.error({ error }, "Unable to validate.");
      throw error;
    }
  }, []);

  const signin = useCallback(async (username: string, password: string) => {
    try {
      await makeHttpRequest<void>("post", "/auth/signin", {
        username,
        password,
      });
    } catch (error) {
      console.error({ error }, "Unable to sign in.");
      throw error;
    }
  }, []);

  const signout = useCallback(async () => {
    try {
      await makeHttpRequest<void>("post", "/auth/signout");
      window.location.reload();
    } catch (error) {
      console.error({ error }, "Unable to sign out.");
      throw error;
    }
  }, []);

  const signup = useCallback(
    async (username: string, password: string, passwordAgain: string) => {
      try {
        await makeHttpRequest<void>("post", "/auth/signup", {
          username,
          password,
          passwordAgain,
        });

        window.location.reload();
      } catch (error) {
        console.error({ error }, "Unable to sign up.");
        throw error;
      }
    },
    []
  );

  const requestTicket = useCallback(async () => {
    try {
      const { ticket } = await makeHttpRequest<{ ticket: string }>(
        "get",
        "/auth/ticket"
      );

      return ticket;
    } catch (error) {
      console.error({ error }, "Unable to retrieve a ticket.");
      throw error;
    }
  }, []);

  return useMemo(
    () => ({
      validate,
      signin,
      signout,
      signup,
      requestTicket,
    }),
    [validate, signin, signout, signup, requestTicket]
  );
}
