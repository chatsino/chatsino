import { makeHttpRequest } from "helpers";

export interface UserListLoaderData {
  users: ChatsinoUser[];
}

export async function userListLoader(): Promise<UserListLoaderData> {
  const { users } = (await makeHttpRequest("get", "/users")) as {
    users: ChatsinoUser[];
  };

  return {
    users,
  };
}
