import { createLogger } from "logger";
import { REDIS } from "persistence";
import * as yup from "yup";
import { Room, RoomCreate, User, UserCreate } from "./types";

export const CACHE_SERVER_LOGGER = createLogger("Cache Server");

const JSON = REDIS.json;

export class CacheServer {
  public static keys = {
    // User
    user: (id: number) => `user:${id}`,
    userRooms: (id: number) => `user:${id}:rooms`,
    userCount: () => "user:count",
    userList: () => "user:list",
    username: (username: string) => `user:username:${username}`,

    // Room
    room: (id: number) => `room:${id}`,
    roomMessages: (id: number) => `room:${id}:messages`,
    roomUsers: (id: number) => `room:${id}:users`,
    roomCount: () => "room:count",
    roomList: () => "room:list",
    roomTitle: (title: string) => `room:title:${title}`,

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
    // Room
    roomCreateSchema: yup
      .object({
        avatar: yup.string().required(),
        title: yup.string().required(),
        description: yup.string().required(),
        password: yup.string().optional().default(""),
      })
      .required(),
  };

  public static errors = {
    ConflictError: class extends Error {},
    ValidationError: yup.ValidationError,
  };

  private redis = REDIS;
  private json = this.redis.json;

  // #region Mutations
  public async createUser(data: UserCreate) {
    await CacheServer.schemas.userCreateSchema.validate(data);

    const existingUserWithUsername = await this.queryUsername(data.username);

    if (existingUserWithUsername) {
      throw new CacheServer.errors.ConflictError("Username already exists.");
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

  public async createRoom(ownerId: number, data: RoomCreate) {
    await CacheServer.schemas.roomCreateSchema.validate(data);

    const existingRoomWithTitle = await this.queryRoomTitle(data.title);

    if (existingRoomWithTitle) {
      throw new CacheServer.errors.ConflictError(
        "Room with title already exists."
      );
    }

    const room: Room = {
      ...data,
      id: await this.redis.incr(CacheServer.keys.roomCount()),
      ownerId,
      createdAt: new Date().toString(),
      changedAt: new Date().toString(),
      permissions: {
        [ownerId]: ["owner"],
      },
    };

    await this.json.set(CacheServer.keys.room(room.id), ".", room);
    await this.redis.set(CacheServer.keys.roomTitle(room.title), room.id);

    return room;
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

  public async queryRoomTitle(title: string) {
    return parseInt(
      (await this.redis.get(CacheServer.keys.roomTitle(title))) ?? "0"
    );
  }
  // #endregion
}
