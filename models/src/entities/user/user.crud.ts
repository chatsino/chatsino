/* istanbul ignore file */
import { rightNow } from "helpers";
import { executeCommand } from "cache";
import { userErrors } from "./user.errors";
import { createUserRepository, User } from "./user.schema";
import { UserCreate, UserRole } from "./user.types";

export const userCrud = {
  create: async (data: UserCreate & { role: UserRole }) =>
    executeCommand(async (client) => {
      const repository = createUserRepository(client);
      const { password, ...rest } = data;
      const user = repository.createEntity({
        ...rest,
        createdAt: rightNow(),
        changedAt: rightNow(),
        chips: 0,
        sessionCount: 0,
        lastActive: rightNow(),
        banDuration: 0,
        hash: "",
        salt: "",
      });

      user.id = user.entityId;

      await user.changePassword(password);
      await repository.save(user);

      return user;
    }) as Promise<User>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) =>
      [await createUserRepository(client).fetch(...ids)]
        .flat()
        .filter((user) => user.id)
    ) as Promise<User[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const user = await createUserRepository(client).fetch(id);

      if (!user.id) {
        throw new userErrors.NotFoundError();
      }

      return user;
    }) as Promise<User>,
  update: (id: string, data: Partial<User>) =>
    executeCommand(async (client) => {
      const user = await userCrud.read(id);

      Object.assign(user, {
        ...data,
        changedAt: rightNow(),
      });

      await createUserRepository(client).save(user);

      return user;
    }) as Promise<User>,
  delete: (id: string) =>
    executeCommand(async (client) => createUserRepository(client).remove(id)),
};
