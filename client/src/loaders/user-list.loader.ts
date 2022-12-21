import { makeHttpRequest } from "helpers";

export interface UserListLoaderData {
  active: ChatUserData[];
  inactive: ChatUserData[];
}

export async function userListLoader(): Promise<UserListLoaderData> {
  const { active, inactive } = (await makeHttpRequest("get", "/users")) as {
    active: ChatUserData[];
    inactive: ChatUserData[];
  };

  return {
    active,
    inactive,
  };
}
