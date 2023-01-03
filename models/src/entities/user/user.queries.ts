import { executeCommand } from "cache";
import { userCrud } from "./user.crud";
import { createUserRepository, User } from "./user.schema";
import { UserRole } from "./user.types";

export const userQueries = {
  user: userCrud.read,
  allUsers: () =>
    executeCommand((client) =>
      createUserRepository(client).search().return.all()
    ).then((users: User[]) => users.map((each) => each.fields)),
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
    ).then((result: null | User) => (result ? result.fields : null)),
  usersByUsernameList: (...usernames: string[]) =>
    executeCommand((client) =>
      createUserRepository(client)
        .search()
        .where("username")
        .containOneOf(...usernames)
        .return.all()
    ).then((users: User[]) => users.map((each) => each.fields)),
  usersByRole: (role: UserRole) =>
    executeCommand((client) =>
      createUserRepository(client)
        .search()
        .where("role")
        .equals(role)
        .return.all()
    ).then((users: User[]) => users.map((each) => each.fields)),
  allModerators: () => userQueries.usersByRole("moderator"),
  allAdministrators: () => userQueries.usersByRole("administrator"),
  allOperators: () => userQueries.usersByRole("operator"),
  bannedUsers: () =>
    executeCommand((client) =>
      createUserRepository(client)
        .search()
        .where("banDuration")
        .equals(-1)
        .or("banDuration")
        .is.greaterThan(0)
        .return.all()
    ).then((users: User[]) => users.map((each) => each.fields)),
  canUserAfford: async (userId: string, amount: number) => {
    try {
      const user = await userCrud.read(userId);

      return user.chips >= amount;
    } catch {
      return false;
    }
  },
  isCorrectPassword: async (username: string, attempt: string) => {
    try {
      const userFields = await userQueries.userByUsername(username);

      if (!userFields) {
        return false;
      }

      return (await userCrud.read(userFields.id)!).checkPassword(attempt);
    } catch {
      return false;
    }
  },
};
