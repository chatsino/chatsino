import { createLogger } from "logger";
import { REDIS } from "persistence";
import * as yup from "yup";
import { User, UserCreate } from "./types";

export const CACHE_SERVER_LOGGER = createLogger("Cache Server");

const JSON = REDIS.json;

export class CacheServer {
  public static keys = {
    // User
    user: (id: number) => `user:${id}`,
    userRooms: (id: number) => `user:${id}:rooms`,
    username: (username: string) => `username:${username}`,
    userCount: () => "user:count",
    userList: () => "user:list",

    // Room
    room: (id: number) => `room:${id}`,
    roomMessages: (id: number) => `room:${id}:messages`,
    roomUsers: (id: number) => `room:${id}:users`,
    roomList: () => "room:list",
    roomCount: () => "room:count",

    // Message
    messageCount: () => "message:count",
  };

  public static schemas = {
    // User
    userCreateSchema: yup
      .object({
        avatar: yup.string().required(),
        username: yup.string().required(),
      })
      .required(),
  };

  public static errors = {
    ConflictError: class extends Error {},
  };

  private redis = REDIS;
  private json = this.redis.json;

  // #region Mutations
  public async createUser(data: UserCreate) {
    await CacheServer.schemas.userCreateSchema.validate(data);

    const existingUserWithUsername = await this.queryUsername(data.username);

    if (existingUserWithUsername) {
      throw new CacheServer.errors.ConflictError();
    }

    const user: User = {
      ...data,
      id: await this.redis.incr(CacheServer.keys.userCount()),
      chips: 0,
      rooms: [],
      createdAt: new Date().toString(),
      changedAt: new Date().toString(),
    };

    await this.json.set(CacheServer.keys.user(user.id), ".", user);
    await this.redis.set(CacheServer.keys.username(user.username), user.id);

    return user;
  }
  // #endregion

  // #region Queries
  public async queryUserCount() {
    return parseInt(
      (await this.redis.get(CacheServer.keys.userCount())) ?? "0"
    );
  }

  public async queryRoomCount() {
    return parseInt(
      (await this.redis.get(CacheServer.keys.roomCount())) ?? "0"
    );
  }

  public async queryMessageCount() {
    return parseInt(
      (await this.redis.get(CacheServer.keys.messageCount())) ?? "0"
    );
  }

  public async queryUsername(username: string) {
    return parseInt(
      (await this.redis.get(CacheServer.keys.username(username))) ?? "0"
    );
  }
  // #endregion
}
