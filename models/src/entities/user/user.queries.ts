import { executeCommand } from "cache";
import { userCrud } from "./user.crud";
import { createUserRepository, User } from "./user.schema";
import { UserRole } from "./user.types";

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
  usersByRole: (role: UserRole) =>
    executeCommand((client) =>
      createUserRepository(client)
        .search()
        .where("role")
        .equals(role)
        .return.all()
    ) as Promise<User[]>,
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
    ) as Promise<User[]>,
  canUserAfford: async (userId: string, amount: number) => {
    try {
      const user = await userCrud.read(userId);

      return user.chips >= amount;
    } catch {
      return false;
    }
  },
  isCorrectPassword: async (userId: string, attempt: string) => {
    try {
      const user = await userCrud.read(userId);

      return user.checkPassword(attempt);
    } catch {
      return false;
    }
  },
};
