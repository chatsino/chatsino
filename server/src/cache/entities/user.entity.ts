import { executeCommand } from "cache/object-mapper";
import { UserCreate } from "cache/types";
import { rightNow } from "helpers";
import { Client, Entity, Schema } from "redis-om";

export interface User {
  id: string;
  createdAt: string;
  changedAt: string;
  avatar: string;
  username: string;
  chips: number;
  sessionCount: number;
  lastActive: string;
}

export type UserData = User;

export class User extends Entity {}

export const userSchema = new Schema(User, {
  id: {
    type: "string",
  },
  createdAt: {
    type: "date",
  },
  changedAt: {
    type: "date",
  },
  avatar: {
    type: "string",
  },
  username: {
    type: "string",
  },
  chips: {
    type: "number",
  },
  sessionCount: {
    type: "number",
  },
  lastActive: {
    type: "date",
  },
});

export const createUserRepository = (client: Client) =>
  client.fetchRepository(userSchema);

export const createUserIndex = () =>
  executeCommand(async (client) => createUserRepository(client).createIndex());

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

      return repository.save(user);
    }) as Promise<User>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) =>
      createUserRepository(client).fetch(...ids)
    ) as Promise<User[]>,
  read: (id: string) => userCrud.readList(id).then((entities) => entities[0]),
  update: (id: string, data: Partial<User>) =>
    executeCommand(async (client) => {
      const repository = createUserRepository(client);
      const user = await repository.fetch(id);

      if (!user) {
        throw new userErrors.UserNotFoundError();
      }

      user.avatar = data.avatar ?? user.avatar;
      user.username = data.username ?? user.username;
      user.chips = data.chips ?? user.chips;
      user.sessionCount = data.sessionCount ?? user.sessionCount;
      user.changedAt = rightNow();

      return repository.save(user);
    }),
  delete: (id: string) =>
    executeCommand(async (client) => createUserRepository(client).remove(id)),
};

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
};

export const userMutations = {
  createUserEntity: async (data: UserCreate) => {
    const existingUserWithUsername = await userQueries.userByUsername(
      data.username
    );

    if (existingUserWithUsername) {
      throw new userErrors.UsernameConflictError();
    }

    return userCrud.create(data);
  },
  updateUserEntity: async (id: string, data: Partial<User>) => {
    const user = await userCrud.read(id);

    if (!user) {
      throw new userErrors.UserNotFoundError();
    }

    if (data.username) {
      const existingUserWithUsername = await userQueries.userByUsername(
        data.username
      );

      if (!existingUserWithUsername) {
        throw new userErrors.UsernameConflictError();
      }
    }

    return userCrud.update(id, data);
  },
};

export const userErrors = {
  UserNotFoundError: class extends Error {
    statusCode = 404;
    message = "That user does not exist.";
  },
  UsernameConflictError: class extends Error {
    statusCode = 409;
    message = "That username is already in use.";
  },
};

// #endregion

export class UserEntity {
  public static schema = userSchema;
  public static createIndex = createUserIndex;
  public static crud = userCrud;
  public static queries = userQueries;
  public static mutations = userMutations;
  public static errors = userErrors;
}
