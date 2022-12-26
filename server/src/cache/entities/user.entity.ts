import { executeCommand } from "cache/object-mapper";
import { rightNow } from "helpers";
import { Client, Entity, Schema } from "redis-om";

export type UserCreate = {
  avatar: string;
  username: string;
};

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

export class User extends Entity {
  public get fields() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      changedAt: this.changedAt,
      avatar: this.avatar,
      username: this.username,
      chips: this.chips,
      sessionCount: this.sessionCount,
      lastActive: this.lastActive,
    };
  }
}

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
  executeCommand((client) => createUserRepository(client).createIndex());

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

      return user.id ? user : null;
    }) as Promise<null | User>,
  update: (id: string, data: Partial<User>) =>
    executeCommand(async (client) => {
      const repository = createUserRepository(client);
      const user = await repository.fetch(id);

      if (!user.id) {
        throw new userErrors.UserNotFoundError();
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

export const userMutations = {
  createUser: async (data: UserCreate) => {
    const existingUserWithUsername = await userQueries.userByUsername(
      data.username
    );

    if (existingUserWithUsername) {
      throw new userErrors.UsernameConflictError();
    }

    return userCrud.create(data);
  },
  updateUser: async (id: string, data: Partial<User>) => {
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
