import { executeCommand } from "cache/object-mapper";
import { createUserRepository, User } from "./user.schema";

export const userQueries = {
  allUsers: () =>
    executeCommand((client) =>
      createUserRepository(client).search().return.all()
    ) as Promise<User[]>,
  totalUsers: () =>
    executeCommand((client) =>
      createUserRepository(client).search().return.count()
    ) as Promise<number>,
  userByUsername: (username: string) =>
    executeCommand((client) =>
      createUserRepository(client)
        .search()
        .where("username")
        .equals(username)
        .return.first()
    ) as Promise<User>,
  usersByUsernameList: (...usernames: string[]) =>
    executeCommand((client) =>
      createUserRepository(client)
        .search()
        .where("username")
        .containOneOf(...usernames)
        .return.all()
    ) as Promise<User[]>,
};
