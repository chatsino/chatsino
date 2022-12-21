import { makeHttpRequest } from "helpers";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SafeClient } from "schemas";
import { useClient } from "./useClient";

export function useAuthenticationRequests() {
  const { setClient } = useClient();
  const navigate = useNavigate();

  const validate = useCallback(async () => {
    try {
      const { client } = (await makeHttpRequest("get", "/auth/validate")) as {
        client: null | SafeClient;
      };

      setClient(client);
    } catch (error) {
      console.error({ error }, "Unable to validate.");
      throw error;
    }
  }, [setClient]);

  const signin = useCallback(
    async (username: string, password: string) => {
      try {
        const { client } = (await makeHttpRequest("post", "/auth/signin", {
          username,
          password,
        })) as {
          client: null | SafeClient;
        };

        setClient(client);
      } catch (error) {
        console.error({ error }, "Unable to sign in.");
        throw error;
      }
    },
    [setClient]
  );

  const signout = useCallback(async () => {
    try {
      await makeHttpRequest<void>("post", "/auth/signout");

      setClient(null);
      navigate("/signin");
    } catch (error) {
      console.error({ error }, "Unable to sign out.");
      throw error;
    }
  }, [setClient, navigate]);

  const signup = useCallback(
    async (username: string, password: string, passwordAgain: string) => {
      try {
        const { client } = (await makeHttpRequest("post", "/auth/signup", {
          username,
          password,
          passwordAgain,
        })) as {
          client: null | SafeClient;
        };

        setClient(client);
      } catch (error) {
        console.error({ error }, "Unable to sign up.");
        throw error;
      }
    },
    [setClient]
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
