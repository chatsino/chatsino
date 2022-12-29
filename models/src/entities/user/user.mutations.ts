import * as config from "config";
import { USER_ROLE_RANKING } from "./user.config";
import { userCrud } from "./user.crud";
import { userErrors } from "./user.errors";
import { userQueries } from "./user.queries";
import { User } from "./user.schema";
import { UserCreate, UserRole } from "./user.types";

export const userMutations = {
  createUser: async (data: UserCreate) => {
    const existingUserWithUsername = await userQueries.userByUsername(
      data.username
    );

    if (existingUserWithUsername) {
      throw new userErrors.UsernameConflictError();
    }

    return userCrud.create({
      ...data,
      role: (await userQueries.totalUsers()) === 0 ? "operator" : "user",
    });
  },
  updateUser: async (userId: string, data: Partial<User>) => {
    if (data.username) {
      const existingUserWithUsername = await userQueries.userByUsername(
        data.username
      );

      if (!existingUserWithUsername) {
        throw new userErrors.UsernameConflictError();
      }
    }

    return userCrud.update(userId, data);
  },
  reassignUser: async (
    modifyingUserId: string,
    modifiedUserId: string,
    role: UserRole
  ) => {
    if (role === "operator") {
      throw new userErrors.ForbiddenError();
    }

    const [modifyingUser, modifiedUser] = await userCrud.readList(
      modifyingUserId,
      modifiedUserId
    );

    if (!modifyingUser || !modifiedUser) {
      throw new userErrors.NotFoundError();
    }

    const requiredPermission: UserRole =
      role === "administrator" ? "operator" : "administrator";

    if (!modifyingUser.permissions[requiredPermission]) {
      throw new userErrors.ForbiddenError();
    }

    modifiedUser.reassign(role);

    return userCrud.update(modifiedUser.id, modifiedUser);
  },
  tempbanUser: async (
    modifyingUserId: string,
    modifiedUserId: string,
    duration: number
  ) => {
    const [modifyingUser, modifiedUser] = await userCrud.readList(
      modifyingUserId,
      modifiedUserId
    );

    if (!modifyingUser || !modifiedUser) {
      throw new userErrors.NotFoundError();
    }

    const modifyingRank = USER_ROLE_RANKING.indexOf(modifyingUser.role);
    const modifiedRank = USER_ROLE_RANKING.indexOf(modifiedUser.role);

    if (modifyingRank <= modifiedRank) {
      throw new userErrors.ForbiddenError();
    }

    modifiedUser.ban(duration);

    return userCrud.update(modifiedUserId, modifiedUser);
  },
  permabanUser: async (modifyingUserId: string, modifiedUserId: string) =>
    userMutations.tempbanUser(modifyingUserId, modifiedUserId, -1),
  chargeUser: async (userId: string, amount: number) => {
    const user = await userCrud.read(userId);

    if (user.chips < amount) {
      throw new userErrors.CannotAffordError();
    }

    user.charge(amount);

    return userCrud.update(user.id, user);
  },
  payUser: async (userId: string, amount: number) => {
    if (amount < 1) {
      return;
    }

    const user = await userCrud.read(userId);

    user.pay(amount);

    return userCrud.update(user.id, user);
  },
  changeUserPassword: async (
    modifyingUserId: string,
    modifiedUserId: string,
    password: string
  ) => {
    if (password.length < config.MINIMUM_PASSWORD_SIZE) {
      throw new userErrors.MinimumPasswordSizeError();
    }

    const [modifyingUser, modifiedUser] = await userCrud.readList(
      modifyingUserId,
      modifiedUserId
    );

    if (!modifyingUser || !modifiedUser) {
      throw new userErrors.NotFoundError();
    }

    if (modifyingUserId !== modifiedUserId && !modifyingUser.isOperator) {
      throw new userErrors.ForbiddenError();
    }

    await modifiedUser.changePassword(password);

    return userCrud.update(modifiedUser.id, modifiedUser);
  },
};
