import { executeCommand } from "cache/object-mapper";
import { rightNow } from "helpers";
import { Client, Entity, Schema } from "redis-om";
import { MessageEntity } from "./message";
import { UserEntity, UserNotFoundError } from "./user";

export type OwnerPermissionMarker = "O";
export type CoOwnerPermissionMarker = "C";
export type GuestPermissionMarker = "G"; // Not stored, only used for checks.
export type TalkPermissionMarker = "T"; // Not stored, only used for checks.
export type MutedPermissionMarker = "M";
export type BlacklistedPermissionMarker = "B";
export type WhitelistedPermissionMarker = "W";

export type PermissionMarker =
  | OwnerPermissionMarker
  | CoOwnerPermissionMarker
  | GuestPermissionMarker
  | TalkPermissionMarker
  | MutedPermissionMarker
  | BlacklistedPermissionMarker
  | WhitelistedPermissionMarker;

export type OnlyPermissionMarker<S> = S extends ""
  ? unknown
  : S extends `${PermissionMarker}${infer Tail}`
  ? OnlyPermissionMarker<Tail>
  : never;

export enum RoomPermission {
  Owner = "O",
  CoOwner = "C",
  Guest = "G",
  Talk = "T",
  Muted = "M",
  Blacklisted = "B",
  Whitelisted = "W",
}

export type RoomUserPermissions = Record<RoomPermission, boolean>;

export type RoomPermissionLookup = Record<string, RoomUserPermissions>;

export type RoomCreate = {
  ownerId: string;
  avatar: string;
  title: string;
  description: string;
  password: string;
};

export interface Room {
  id: string;
  ownerId: string;
  createdAt: string;
  changedAt: string;
  avatar: string;
  title: string;
  description: string;
  password: string;
  users: string[];
  permissions: string[];
  messages: string[];
  pins: string[];
}

export class Room extends Entity {
  public get fields() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      createdAt: this.createdAt,
      changedAt: this.changedAt,
      avatar: this.avatar,
      title: this.title,
      description: this.description,
      password: this.password,
      users: this.users,
      permissions: this.permissions,
      messages: this.messages,
      pins: this.pins,
    };
  }

  public get permissionLookup(): RoomPermissionLookup {
    const whitelistActive = this.permissions.some((permissions) =>
      deserializeRoomPermissions(permissions).permissions.includes("W")
    );

    return this.permissions.reduce((prev, next) => {
      const { userId, permissions } = deserializeRoomPermissions(next);
      const isOwner = permissions.includes(RoomPermission.Owner);
      const permissionLookup = {
        [RoomPermission.Owner]: isOwner,
        [RoomPermission.CoOwner]:
          isOwner || permissions.includes(RoomPermission.CoOwner),
        [RoomPermission.Muted]: permissions.includes(RoomPermission.Muted),
        [RoomPermission.Blacklisted]: permissions.includes(
          RoomPermission.Blacklisted
        ),
        [RoomPermission.Whitelisted]: permissions.includes(
          RoomPermission.Whitelisted
        ),
      };
      const isAnOwner =
        permissionLookup[RoomPermission.Owner] ||
        permissionLookup[RoomPermission.CoOwner];
      const meetsGuestRequirements =
        isAnOwner ||
        (!permissionLookup[RoomPermission.Blacklisted] &&
          (!whitelistActive ||
            (whitelistActive && permissionLookup[RoomPermission.Whitelisted])));

      prev[userId] = {
        ...permissionLookup,
        [RoomPermission.Guest]: meetsGuestRequirements,
        [RoomPermission.Talk]:
          meetsGuestRequirements && !permissionLookup[RoomPermission.Muted],
      };

      return prev;
    }, {} as Record<string, RoomUserPermissions>);
  }

  public get whitelistActive(): boolean {
    return Object.values(this.permissionLookup).some(
      (permissions) => permissions[RoomPermission.Whitelisted]
    );
  }

  public getUserPermissions(userId: string): RoomUserPermissions {
    const whitelistActive = this.permissions.some((permissions) =>
      deserializeRoomPermissions(permissions).permissions.includes("W")
    );

    return (
      this.permissionLookup[userId] ?? {
        [RoomPermission.Owner]: false,
        [RoomPermission.CoOwner]: false,
        [RoomPermission.Guest]: !whitelistActive,
        [RoomPermission.Talk]: !whitelistActive,
        [RoomPermission.Muted]: false,
        [RoomPermission.Blacklisted]: false,
        [RoomPermission.Whitelisted]: false,
      }
    );
  }

  public meetsPermissionRequirement<T extends string>(
    userId: string,
    requirement: T & OnlyPermissionMarker<T>
  ): boolean {
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions[requirement as keyof RoomUserPermissions];
  }

  public pinMessage(messageId: string) {
    if (!this.messages.includes(messageId)) {
      throw new roomErrors.RoomMessageNotFoundError();
    }

    const previouslyPinned = this.pins.includes(messageId);

    if (previouslyPinned) {
      this.pins = this.pins.filter((each) => each !== messageId);
    } else {
      this.pins.push(messageId);
    }

    return !previouslyPinned;
  }

  public removeMessage(messageId: string) {
    if (!this.messages.includes(messageId)) {
      throw new roomErrors.RoomMessageNotFoundError();
    }

    this.messages = this.messages.filter((each) => each !== messageId);
  }
}

export const roomSchema = new Schema(Room, {
  id: {
    type: "string",
  },
  ownerId: {
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
  title: {
    type: "text",
  },
  description: {
    type: "text",
  },
  password: {
    type: "string",
  },
  permissions: {
    type: "string[]",
  },
  users: {
    type: "string[]",
  },
  messages: {
    type: "string[]",
  },
  pins: {
    type: "string[]",
  },
});

export const createRoomRepository = (client: Client) =>
  client.fetchRepository(roomSchema);

export const createRoomIndex = () =>
  executeCommand((client) => createRoomRepository(client).createIndex());

export const roomCrud = {
  create: (data: RoomCreate) =>
    executeCommand(async (client) => {
      const repository = createRoomRepository(client);
      const room = repository.createEntity({
        ...data,
        createdAt: rightNow(),
        changedAt: rightNow(),
        permissions: [serializeRoomPermissions(data.ownerId, "O")],
        users: [],
        messages: [],
        pins: [],
      });

      room.id = room.entityId;

      await repository.save(room);

      return room;
    }) as Promise<Room>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) => {
      const rooms = await createRoomRepository(client).fetch(...ids);

      return [rooms].flat().filter((room) => room.id);
    }) as Promise<Room[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const room = await createRoomRepository(client).fetch(id);

      if (!room.id) {
        throw new roomErrors.RoomNotFoundError();
      }

      return room;
    }) as Promise<Room>,
  update: (id: string, data: Partial<Room>) =>
    executeCommand(async (client) => {
      const repository = createRoomRepository(client);
      const room = await repository.fetch(id);

      if (!room.id) {
        throw new roomErrors.RoomNotFoundError();
      }

      room.id = data.id ?? room.id;
      room.avatar = data.avatar ?? room.avatar;
      room.title = data.title ?? room.title;
      room.description = data.description ?? room.description;
      room.password = data.password ?? room.password;
      room.permissions = data.permissions ?? room.permissions;
      room.messages = data.messages ?? room.messages;
      room.users = data.users ?? room.users;
      room.pins = data.pins ?? room.pins;
      room.changedAt = rightNow();

      await repository.save(room);

      return roomCrud.read(room.entityId);
    }) as Promise<Room>,
  delete: (id: string) =>
    executeCommand(async (client) => createRoomRepository(client).remove(id)),
};

export const roomQueries = {
  allRooms: () =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("title")
        .does.not.match("DM*")
        .return.all()
    ) as Promise<Room[]>,
  allPublicRooms: async () => {
    const rooms = await roomQueries.allRooms();

    return rooms.filter(
      (room) =>
        room.id === room.entityId && !(room.password || room.whitelistActive)
    );
  },
  totalRooms: () =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("title")
        .does.not.match("DM*")
        .return.count()
    ) as Promise<number>,
  roomById: (roomId: string) =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("id")
        .equals(roomId)
        .return.first()
    ) as Promise<null | Room>,
  roomByRoomTitle: (title: string) =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("title")
        .match(title)
        .return.first()
    ) as Promise<null | Room>,
  userPermissions: async (roomId: string, userId: string) => {
    const room = await roomCrud.read(roomId);

    return room.getUserPermissions(userId);
  },
  meetsRoomPermissionRequirement: async <T extends string>(
    roomId: string,
    userId: string,
    requirement: T & OnlyPermissionMarker<T>
  ) => {
    const room = await roomCrud.read(roomId);

    return room.meetsPermissionRequirement(userId, requirement);
  },
  roomUsers: async (roomId: string) => {
    const room = await roomCrud.read(roomId);

    return UserEntity.crud.readList(...room.users);
  },
  roomMessages: async (roomId: string) => {
    const room = await roomCrud.read(roomId);

    return MessageEntity.crud.readList(...room.messages);
  },
};

export const roomMutations = {
  createRoom: async (data: RoomCreate) => {
    const { ownerId } = data;
    const user = await UserEntity.crud.read(ownerId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const existingRoomWithRoomTitle = await roomQueries.roomByRoomTitle(
      data.title
    );

    if (existingRoomWithRoomTitle) {
      throw new roomErrors.RoomTitleConflictError();
    }

    return roomCrud.create(data);
  },
  createDirectMessageRoom: async (userIdA: string, userIdB: string) => {
    const [sendingUser, receivingUser] = await UserEntity.crud.readList(
      userIdA,
      userIdB
    );

    if (!sendingUser || !receivingUser) {
      throw new UserNotFoundError();
    }

    const roomId = serializeDirectMessageRoomId(userIdA, userIdB);
    const existingDirectMessageRoom = await roomQueries.roomById(roomId);

    if (existingDirectMessageRoom) {
      throw new roomErrors.RoomForbiddenActionError();
    }

    const room = await roomCrud.create({
      ownerId: "",
      avatar: "",
      title: `DM: ${sendingUser.username} & ${receivingUser.username}`,
      description: `A private conversation between ${sendingUser.username} and ${receivingUser.username}.`,
      password: "",
    });

    room.id = roomId;
    room.users = [userIdA, userIdB];

    return roomCrud.update(room.entityId, room);
  },
  updateRoom: async (roomId: string, data: Partial<Room>) => {
    if (data.title) {
      const existingRoomWithRoomTitle = await roomQueries.roomByRoomTitle(
        data.title
      );

      if (existingRoomWithRoomTitle) {
        throw new roomErrors.RoomTitleConflictError();
      }
    }

    return roomCrud.update(roomId, data);
  },
  joinRoom: async (roomId: string, userId: string, password = "") => {
    const room = await roomCrud.read(roomId);

    if (room.users.includes(userId)) {
      return roomMutations.leaveRoom(roomId, userId);
    }

    if (password !== room.password) {
      throw new roomErrors.RoomIncorrectPasswordError();
    }

    if (!room.meetsPermissionRequirement(userId, "G")) {
      throw new roomErrors.RoomNotAllowedError();
    }

    room.users.push(userId);

    return roomCrud.update(roomId, { users: room.users });
  },
  leaveRoom: async (roomId: string, userId: string) => {
    const room = await roomCrud.read(roomId);
    const previousUserCount = room.users.length;

    room.users = room.users.filter((each) => each !== userId);

    return room.users.length === previousUserCount
      ? Promise.resolve(room)
      : roomCrud.update(room.id, room);
  },
  modifyUserPermissions: async <M extends string>(
    roomId: string,
    modifyingUserId: string,
    modifiedUserId: string,
    operation: "add" | "remove",
    markers: M & OnlyPermissionMarker<M>
  ) => {
    const room = await roomCrud.read(roomId);
    const hasOwnerPermission = room.meetsPermissionRequirement(
      modifyingUserId,
      RoomPermission.Owner
    );

    if (!hasOwnerPermission) {
      throw new roomErrors.RoomForbiddenModificationError();
    }

    const roomPermissionsBeforeChange = room.permissions.map(
      deserializeRoomPermissions
    );
    const userPermissionBeforeChange = roomPermissionsBeforeChange.find(
      (each) => each.userId === modifiedUserId
    ) ?? {
      userId: modifiedUserId,
      permissions: "",
    };
    const userPermissionMarkersBeforeChange =
      userPermissionBeforeChange.permissions.split("");
    const otherPermissionsBeforeChange = roomPermissionsBeforeChange.filter(
      (each) => each.userId !== modifiedUserId
    );
    const modifiedPermissions = markers.split("");
    const userPermissionMarkersAfterChange =
      operation === "add"
        ? Array.from(
            new Set(
              userPermissionMarkersBeforeChange.concat(modifiedPermissions)
            )
          ).join("")
        : userPermissionMarkersBeforeChange
            .filter((each) => !modifiedPermissions.includes(each))
            .join("");
    const userPermissionsAfterChange = {
      userId: modifiedUserId,
      permissions: userPermissionMarkersAfterChange,
    };

    room.permissions = otherPermissionsBeforeChange
      .concat(userPermissionsAfterChange)
      .map((each) => serializeRoomPermissions(each.userId, each.permissions));

    return roomCrud.update(room.id, room);
  },
  toggleUserPermission: async (
    roomId: string,
    modifyingUserId: string,
    modifiedUserId: string,
    permission: PermissionMarker
  ) => {
    const previousPermissions = await roomQueries.userPermissions(
      roomId,
      modifiedUserId
    );
    const previouslyPermitted = previousPermissions[permission];

    return roomMutations.modifyUserPermissions(
      roomId,
      modifyingUserId,
      modifiedUserId,
      previouslyPermitted ? "remove" : "add",
      permission
    );
  },
  toggleCoOwner: (
    roomId: string,
    modifyingUserId: string,
    modifiedUserId: string
  ) =>
    roomMutations.toggleUserPermission(
      roomId,
      modifyingUserId,
      modifiedUserId,
      RoomPermission.CoOwner
    ),
  toggleBlacklisted: (
    roomId: string,
    modifyingUserId: string,
    modifiedUserId: string
  ) =>
    roomMutations.toggleUserPermission(
      roomId,
      modifyingUserId,
      modifiedUserId,
      RoomPermission.Blacklisted
    ),
  toggleWhitelisted: (
    roomId: string,
    modifyingUserId: string,
    modifiedUserId: string
  ) =>
    roomMutations.toggleUserPermission(
      roomId,
      modifyingUserId,
      modifiedUserId,
      RoomPermission.Whitelisted
    ),
  toggleMuted: (
    roomId: string,
    modifyingUserId: string,
    modifiedUserId: string
  ) =>
    roomMutations.toggleUserPermission(
      roomId,
      modifyingUserId,
      modifiedUserId,
      RoomPermission.Muted
    ),
  sendMessage: async (
    roomId: string,
    userId: string,
    content: string,
    password = ""
  ) => {
    const room = await roomCrud.read(roomId);

    if (
      password !== room.password ||
      !room.meetsPermissionRequirement(userId, RoomPermission.Talk)
    ) {
      throw new roomErrors.RoomForbiddenActionError();
    }

    const message = await MessageEntity.mutations.createMessage({
      roomId,
      userId,
      content,
    });

    room.messages.push(message.id);

    await roomCrud.update(roomId, room);

    return room;
  },
  sendDirectMessage: async (
    sendingUserId: string,
    receivingUserId: string,
    content: string
  ) => {
    const [sendingUser, receivingUser] = await UserEntity.crud.readList(
      sendingUserId,
      receivingUserId
    );

    if (!sendingUser || !receivingUser) {
      throw new UserNotFoundError();
    }

    let existingDirectMessageRoom = await roomQueries.roomById(
      serializeDirectMessageRoomId(sendingUserId, receivingUserId)
    );

    if (!existingDirectMessageRoom) {
      existingDirectMessageRoom = await roomMutations.createDirectMessageRoom(
        sendingUserId,
        receivingUserId
      );
    }

    const message = await MessageEntity.mutations.createMessage({
      roomId: existingDirectMessageRoom.entityId,
      userId: sendingUserId,
      content,
    });

    existingDirectMessageRoom.messages.push(message.id);

    await roomCrud.update(
      existingDirectMessageRoom.entityId,
      existingDirectMessageRoom
    );

    return existingDirectMessageRoom;
  },
  pinMessage: async (roomId: string, userId: string, messageId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room.meetsPermissionRequirement(userId, RoomPermission.CoOwner)) {
      throw new roomErrors.RoomForbiddenActionError();
    }

    room.pinMessage(messageId);

    return roomCrud.update(roomId, room);
  },
  removeMessage: async (roomId: string, userId: string, messageId: string) => {
    const room = await roomCrud.read(roomId);
    const message = await MessageEntity.crud.read(messageId);
    const removingOwnMessage = message.userId === userId;

    if (
      !removingOwnMessage &&
      !room.meetsPermissionRequirement(userId, RoomPermission.CoOwner)
    ) {
      throw new roomErrors.RoomForbiddenActionError();
    }

    if (removingOwnMessage) {
      await MessageEntity.mutations.deleteMessage(messageId, userId);
    }

    room.removeMessage(messageId);
    room.pins = room.pins.filter((each) => room.messages.includes(each));

    return roomCrud.update(roomId, room);
  },
  removeUserMessages: async (roomId: string, userId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room.meetsPermissionRequirement(userId, RoomPermission.Owner)) {
      throw new roomErrors.RoomForbiddenActionError();
    }

    const messages = await roomQueries.roomMessages(roomId);
    const messagesNotFromUser = messages.filter(
      (each) => each.userId !== userId
    );

    room.messages = messagesNotFromUser.map((each) => each.userId);
    room.pins = room.pins.filter((each) => room.messages.includes(each));

    return roomCrud.update(roomId, room);
  },
};

export const roomErrors = {
  RoomIncorrectPasswordError: class extends Error {
    statusCode = 401;
    message = "That is the wrong password.";
  },
  RoomNotAllowedError: class extends Error {
    statusCode = 401;
    message = "User is not allowed in that room.";
  },
  RoomForbiddenActionError: class extends Error {
    statusCode = 403;
    message = "User cannot perform that action.";
  },
  RoomForbiddenModificationError: class extends Error {
    statusCode = 403;
    message = "User cannot modify that room.";
  },
  RoomNotFoundError: class extends Error {
    statusCode = 404;
    message = "That room does not exist.";
  },
  RoomMessageNotFoundError: class extends Error {
    statusCode = 404;
    message = "That message does not exist in that room.";
  },
  RoomTitleConflictError: class extends Error {
    statusCode = 409;
    message = "That room title is already in use.";
  },
};

export class RoomEntity {
  public static schema = roomSchema;
  public static createIndex = createRoomIndex;
  public static crud = roomCrud;
  public static queries = roomQueries;
  public static mutations = roomMutations;
  public static errors = roomErrors;
}

// Helpers
export function serializeRoomPermissions(userId: string, permissions: string) {
  return [userId, permissions].join("/");
}

export function deserializeRoomPermissions(permissionsString: string): {
  userId: string;
  permissions: string;
} {
  const [userId, permissions] = permissionsString.split("/");

  return {
    userId,
    permissions,
  };
}

export function serializeDirectMessageRoomId(userIdA: string, userIdB: string) {
  const joined = [userIdA, userIdB]
    .sort((a, b) => a.localeCompare(b))
    .join("___");
  return `DM/${joined}`;
}

export function deserializeDirectMessageRoomId(roomId: string) {
  const [_, joined] = roomId.split("/");
  const users = joined.split("___");

  return users;
}
