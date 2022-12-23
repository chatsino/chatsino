import { rightNow } from "helpers";
import { createLogger } from "logger";
import { REDIS } from "persistence";
import * as yup from "yup";
import {
  Message,
  MessageCreate,
  MessageID,
  Room,
  RoomCreate,
  RoomID,
  User,
  UserCreate,
  UserID,
} from "./types";

export const CACHE_SERVER_LOGGER = createLogger("Cache Server");

export class CacheServer {
  public static keys = {
    // User
    user: (id: UserID) => `user:${id}`,
    userRooms: (id: UserID) => `user:${id}:rooms`,
    userLastMessageContent: (id: UserID) => `user:${id}:last-message-content`,
    userCount: () => "user:count",
    userList: () => "user:list",
    username: (username: string) => `user:username:${username}`,

    // Room
    room: (id: RoomID) => `room:${id}`,
    roomCount: () => "room:count",
    roomList: () => "room:list",
    roomTitle: (title: string) => `room:title:${title}`,

    // Message
    message: (id: MessageID) => `message:${id}`,
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
        ownerId: yup.number().required(),
        avatar: yup.string().required(),
        title: yup.string().required(),
        description: yup.string().required(),
        password: yup.string().optional().default(""),
      })
      .required(),
    // Message
    messageCreateSchema: yup
      .object({
        authorId: yup.number().required(),
        roomId: yup.number().required(),
        content: yup.string().min(1).required(),
      })
      .required(),
  };

  public static errors = {
    BadRequestError: class extends Error {
      statusCode = 400;
    },
    ConflictError: class extends Error {
      statusCode = 409;
    },
    ValidationError: yup.ValidationError,
  };

  private redis = REDIS;
  private json = this.redis.json;

  // #region API
  public async createUser(data: UserCreate) {
    await CacheServer.schemas.userCreateSchema.validate(data);

    const existingUserWithUsername = await this.queryUsername(data.username);

    if (existingUserWithUsername) {
      throw new CacheServer.errors.ConflictError("Username already exists.");
    }

    const user: User = {
      ...data,
      id: await this.redis.incr(CacheServer.keys.userCount()),
      createdAt: rightNow(),
      changedAt: rightNow(),
      chips: 0,
      rooms: [],
      messages: [],
    };

    await Promise.all([
      this.storeUser(user),
      this.storeUsername(user),
      this.updateUserList(user),
    ]);

    return user;
  }

  public async createRoom(data: RoomCreate) {
    const { ownerId } = await CacheServer.schemas.roomCreateSchema.validate(
      data
    );
    const owner = await this.queryUser(ownerId);

    if (!owner) {
      throw new CacheServer.errors.BadRequestError("User does not exist.");
    }

    const existingRoomWithTitle = await this.queryRoomTitle(data.title);

    if (existingRoomWithTitle) {
      throw new CacheServer.errors.ConflictError(
        "Room with title already exists."
      );
    }

    const room: Room = {
      ...data,
      id: await this.redis.incr(CacheServer.keys.roomCount()),
      createdAt: rightNow(),
      changedAt: rightNow(),
      permissions: {
        [data.ownerId]: ["owner"],
      },
      users: [],
      messages: [],
    };

    await Promise.all([
      this.storeRoom(room),
      this.storeRoomTitle(room),
      this.updateRoomList(room),
    ]);

    return room;
  }

  public async sendMessage(data: MessageCreate) {
    const { authorId, roomId } =
      await CacheServer.schemas.messageCreateSchema.validate(data);
    const author = await this.queryUser(authorId);

    if (!author) {
      throw new CacheServer.errors.BadRequestError("User does not exist.");
    }

    const room = await this.queryRoom(roomId);

    if (!room) {
      throw new CacheServer.errors.BadRequestError("Room does not exist.");
    }

    const lastMessageContent = await this.queryUserLastMessageContent(authorId);

    if (data.content === lastMessageContent) {
      throw new CacheServer.errors.ConflictError("Message was already sent.");
    }

    const message: Message = {
      ...data,
      id: await this.redis.incr(CacheServer.keys.messageCount()),
      createdAt: rightNow(),
      changedAt: rightNow(),
      reactions: {},
    };

    await Promise.all([
      this.storeMessage(message),
      this.updateUserMessages(author, message),
      this.updateRoomMessages(room, message),
      this.storeUserLastMessageContent(author, message.content),
    ]);

    return message;
  }
  // #endregion

  // #region Mutations
  // -- User
  private storeUser(user: User) {
    return this.json.set(CacheServer.keys.user(user.id), ".", user);
  }

  private storeUsername(user: User) {
    return this.redis.set(CacheServer.keys.username(user.username), user.id);
  }

  private storeUserList(list: UserID[]) {
    return this.json.set(CacheServer.keys.userList(), ".", list);
  }

  private storeUserLastMessageContent(user: User, content: string) {
    return this.redis.set(
      CacheServer.keys.userLastMessageContent(user.id),
      content
    );
  }

  private async updateUserList(user: User) {
    const userList = await this.queryUserList();

    if (!userList) {
      return this.storeUserList([user.id]);
    }

    if (!userList.includes(user.id)) {
      return this.json.ARRAPPEND(CacheServer.keys.userList(), ".", user);
    }
  }

  private async updateUserRooms(user: User, room: Room) {
    return this.json.ARRAPPEND(
      CacheServer.keys.user(user.id),
      "rooms",
      room.id
    );
  }

  private async updateUserMessages(user: User, message: Message) {
    return this.json.ARRAPPEND(
      CacheServer.keys.user(user.id),
      "messages",
      message.id
    );
  }

  // -- Room
  private storeRoom(room: Room) {
    return this.json.set(CacheServer.keys.room(room.id), ".", room);
  }

  private storeRoomTitle(room: Room) {
    return this.redis.set(CacheServer.keys.roomTitle(room.title), room.id);
  }

  private storeRoomList(list: RoomID[]) {
    return this.json.set(CacheServer.keys.roomList(), ".", list);
  }

  private async updateRoomList(room: Room) {
    const roomList = await this.queryRoomList();

    if (!roomList) {
      return this.storeRoomList([room.id]);
    }

    if (!roomList.includes(room.id)) {
      return this.json.ARRAPPEND(CacheServer.keys.roomList(), ".", room.id);
    }
  }

  private async updateRoomUsers(room: Room, user: User) {
    return this.json.ARRAPPEND(
      CacheServer.keys.room(room.id),
      "users",
      user.id
    );
  }

  private async updateRoomMessages(room: Room, message: Message) {
    return this.json.ARRAPPEND(
      CacheServer.keys.room(room.id),
      "messages",
      message.id
    );
  }

  // -- Message
  private storeMessage(message: Message) {
    return this.json.set(CacheServer.keys.message(message.id), ".", message);
  }
  // #endregion

  // #region Queries
  public queryUser(id: UserID) {
    return this.json.get(CacheServer.keys.user(id)) as Promise<null | User>;
  }

  public queryUserRooms(id: UserID) {
    return this.json.get(CacheServer.keys.user(id), {
      path: "rooms",
    }) as Promise<null | RoomID[]>;
  }

  public queryUserMessages(id: UserID) {
    return this.json.get(CacheServer.keys.user(id), {
      path: "messages",
    }) as Promise<null | MessageID[]>;
  }

  public queryUserLastMessageContent(id: UserID) {
    return this.redis.get(
      CacheServer.keys.userLastMessageContent(id)
    ) as Promise<null | string>;
  }

  public async queryUserCount() {
    return parseInt(
      (await this.redis.get(CacheServer.keys.userCount())) ?? "0"
    );
  }

  public queryUserList() {
    return this.json.get(CacheServer.keys.userList()) as Promise<
      null | UserID[]
    >;
  }

  public queryRoom(id: RoomID) {
    return this.json.get(CacheServer.keys.room(id)) as Promise<null | Room>;
  }

  public queryRoomUsers(id: RoomID) {
    return this.json.get(CacheServer.keys.room(id), {
      path: "users",
    }) as Promise<null | UserID[]>;
  }

  public queryRoomMessages(id: RoomID) {
    return this.json.get(CacheServer.keys.room(id), {
      path: "messages",
    }) as Promise<null | MessageID[]>;
  }

  public async queryRoomCount() {
    return parseInt(
      (await this.redis.get(CacheServer.keys.roomCount())) ?? "0"
    );
  }

  public queryRoomList() {
    return this.json.get(CacheServer.keys.roomList()) as Promise<
      null | RoomID[]
    >;
  }

  public async queryRoomTitle(title: string) {
    return parseInt(
      (await this.redis.get(CacheServer.keys.roomTitle(title))) ?? "0"
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
