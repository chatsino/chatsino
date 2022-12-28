import { userCrud } from "./user.crud";
import { userQueries } from "./user.queries";
import { User } from "./user.schema";
import {
  UserCannotAffordError,
  UserCreate,
  UsernameConflictError,
} from "./user.types";

export const userMutations = {
  createUser: async (data: UserCreate) => {
    const existingUserWithUsername = await userQueries.userByUsername(
      data.username
    );

    if (existingUserWithUsername) {
      throw new UsernameConflictError();
    }

    return userCrud.create(data);
  },
  updateUser: async (id: string, data: Partial<User>) => {
    await userCrud.read(id);

    if (data.username) {
      const existingUserWithUsername = await userQueries.userByUsername(
        data.username
      );

      if (!existingUserWithUsername) {
        throw new UsernameConflictError();
      }
    }

    return userCrud.update(id, data);
  },
  chargeUser: async (userId: string, amount: number) => {
    const user = await userCrud.read(userId);

    if (user.chips < amount) {
      throw new UserCannotAffordError();
    }

    user.chips -= amount;

    return userCrud.update(user.id, user);
  },
  payUser: async (userId: string, amount: number) => {
    if (amount < 1) {
      return;
    }

    const user = await userCrud.read(userId);

    user.chips += amount;

    return userCrud.update(user.id, user);
  },
};
