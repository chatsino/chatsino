/* istanbul ignore file */
import { executeCommand } from "cache/object-mapper";
import { rightNow } from "helpers";
import { createUserRepository, User } from "./user.schema";
import { UserCreate, UserNotFoundError } from "./user.types";

export const userCrud = {
  create: async (data: UserCreate) =>
    executeCommand(async (client) => {
      const repository = createUserRepository(client);
      const user = repository.createEntity({
        ...data,
        createdAt: rightNow(),
        changedAt: rightNow(),
        chips: 0,
        sessionCount: 0,
        lastActive: rightNow(),
      });

      user.id = user.entityId;

      await repository.save(user);

      return user;
    }) as Promise<User>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) => {
      const users = await createUserRepository(client).fetch(...ids);

      return [users].flat().filter((user) => user.id);
    }) as Promise<User[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const user = await createUserRepository(client).fetch(id);

      if (!user.id) {
        throw new UserNotFoundError();
      }

      return user;
    }) as Promise<User>,
  update: (id: string, data: Partial<User>) =>
    executeCommand(async (client) => {
      const repository = createUserRepository(client);
      const user = await repository.fetch(id);

      if (!user.id) {
        throw new UserNotFoundError();
      }

      user.avatar = data.avatar ?? user.avatar;
      user.username = data.username ?? user.username;
      user.chips = data.chips ?? user.chips;
      user.sessionCount = data.sessionCount ?? user.sessionCount;
      user.changedAt = rightNow();

      await repository.save(user);

      return user;
    }) as Promise<User>,
  delete: (id: string) =>
    executeCommand(async (client) => createUserRepository(client).remove(id)),
};
