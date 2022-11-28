import { makeRequest, setAuthorizationHeader } from "./make-request";
import type { Client } from "persistence";

export async function signin(username: string, password: string) {
  const { client, token } = await makeRequest<{
    client: null | Client;
    token: string;
  }>("post", "/api/auth/signin", {
    username,
    password,
  });

  expect(typeof token).toBe("string");

  setAuthorizationHeader(token);

  return client;
}

export function signout() {
  return makeRequest("post", "/api/auth/signout");
}

export async function validate() {
  const { client } = await makeRequest<{ client: null | Client }>(
    "get",
    "/api/auth/validate"
  );

  return client;
}

export async function getTicket() {
  const { ticket } = await makeRequest<{ ticket: string }>(
    "get",
    "/api/auth/ticket"
  );

  expect(typeof ticket).toBe("string");

  return ticket;
}
