import { executeCommand } from "cache/object-mapper";
import { rightNow } from "helpers";
import { Client, Entity, Schema } from "redis-om";
import { MessageEntity } from "./message.entity";
import { UserEntity, userErrors } from "./user.entity";

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

export type RoomCreate = {
  ownerId: string;
  avatar: string;
  title: string;
  description: string;
  password: string;
};

export class Room extends Entity {
  private get permissionLookup(): RoomPermissionLookup {
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
          (!this.whitelistActive ||
            (this.whitelistActive &&
              permissionLookup[RoomPermission.Whitelisted])));

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
    return (
      this.permissionLookup[userId] ?? {
        [RoomPermission.Owner]: false,
        [RoomPermission.CoOwner]: false,
        [RoomPermission.Guest]: true,
        [RoomPermission.Talk]: true,
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
  create: async (data: RoomCreate) =>
    executeCommand((client) => {
      const repository = createRoomRepository(client);
      const room = repository.createEntity({
        ...data,
        createdAt: rightNow(),
        changedAt: rightNow(),
        permissions: [],
        rooms: [],
        messages: [],
        pins: [],
      });

      room.id = room.entityId;

      return repository.save(room);
    }) as Promise<Room>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) =>
      createRoomRepository(client).fetch(...ids)
    ) as Promise<Room[]>,
  read: (id: string) => roomCrud.readList(id).then((entities) => entities[0]),
  update: (id: string, data: Partial<Room>) =>
    executeCommand(async (client) => {
      const repository = createRoomRepository(client);
      const room = await repository.fetch(id);

      if (!room) {
        throw new roomErrors.RoomNotFoundError();
      }

      room.avatar = data.avatar ?? room.avatar;
      room.title = data.title ?? room.title;
      room.description = data.description ?? room.description;
      room.password = data.password ?? room.password;
      room.permissions = data.permissions ?? room.permissions;
      room.messages = data.messages ?? room.messages;
      room.users = data.users ?? room.users;
      room.pins = data.pins ?? room.pins;
      room.changedAt = rightNow();

      return repository.save(room);
    }),
  delete: (id: string) =>
    executeCommand(async (client) => createRoomRepository(client).remove(id)),
};

export const roomQueries = {
  allRooms: () =>
    executeCommand((client) =>
      createRoomRepository(client).search().return.all()
    ) as Promise<Room[]>,
  allPublicRooms: async () => {
    const rooms = await roomQueries.allRooms();

    return rooms.filter((room) => !(room.password || room.whitelistActive));
  },
  totalRooms: () =>
    executeCommand((client) =>
      createRoomRepository(client).search().return.count()
    ) as Promise<number>,
  roomByRoomTitle: (title: string) =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("title")
        .equals(title)
        .return.first()
    ) as Promise<Room>,
  userPermissions: async (roomId: string, userId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    return room.getUserPermissions(userId);
  },
  meetsRoomPermissionRequirement: async <T extends string>(
    roomId: string,
    userId: string,
    requirement: T & OnlyPermissionMarker<T>
  ) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    return room.meetsPermissionRequirement(userId, requirement);
  },
  roomUsers: async (roomId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    return UserEntity.crud.readList(...room.users);
  },
  roomMessages: async (roomId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    return MessageEntity.crud.readList(...room.messages);
  },
};

export const roomMutations = {
  createRoom: async (data: RoomCreate) => {
    const { ownerId } = data;
    const user = await UserEntity.crud.read(ownerId);

    if (!user) {
      throw new UserEntity.errors.UserNotFoundError();
    }

    const existingRoomWithRoomTitle = await roomQueries.roomByRoomTitle(
      data.title
    );

    if (existingRoomWithRoomTitle) {
      throw new roomErrors.RoomTitleConflictError();
    }

    return roomCrud.create(data);
  },
  updateRoom: async (roomId: string, data: Partial<Room>) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (data.title) {
      const existingRoomWithRoomname = await roomQueries.roomByRoomTitle(
        data.title
      );

      if (!existingRoomWithRoomname) {
        throw new roomErrors.RoomTitleConflictError();
      }
    }

    return roomCrud.update(roomId, data);
  },
  joinRoom: async (roomId: string, userId: string, password = "") => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (room.users.includes(userId)) {
      return roomMutations.leaveRoom(roomId, userId);
    }

    if (password !== room.password) {
      throw new roomErrors.RoomIncorrectPasswordError();
    }

    room.users.push(userId);

    return roomCrud.update(roomId, room);
  },
  leaveRoom: async (roomId: string, userId: string) => {
    const room = await roomCrud.read(roomId);
    const previousUserCount = room.users.length;

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    room.users = room.users.filter((each) => each !== userId);

    return room.users.length === previousUserCount
      ? Promise.resolve()
      : roomMutations.updateRoom(roomId, room);
  },
  modifyUserPermissions: async <M extends string>(
    roomId: string,
    userId: string,
    operation: "add" | "remove",
    markers: M & OnlyPermissionMarker<M>
  ) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    const hasOwnerPermission = room.meetsPermissionRequirement(
      userId,
      RoomPermission.Owner
    );

    if (!hasOwnerPermission) {
      throw new roomErrors.RoomForbiddenModification();
    }

    const modifiedPermissionList = markers.split("");
    const previousUserPermissions =
      room.permissions
        .map(deserializeRoomPermissions)
        .filter((each) => each.userId === userId)
        .map((each) => each.permissions)[0] ?? "";
    const previousUserPermissionList = previousUserPermissions.split("");
    const nextUserPermissionList =
      operation === "add"
        ? Array.from(
            new Set(previousUserPermissionList.concat(modifiedPermissionList))
          )
        : previousUserPermissionList.filter(
            (each) => !modifiedPermissionList.includes(each)
          );
    const nextUserPermissions = serializeRoomPermissions(
      userId,
      nextUserPermissionList.join("")
    );
    const otherPermissions = room.permissions
      .map(deserializeRoomPermissions)
      .filter((each) => each.userId !== userId)
      .map((each) => serializeRoomPermissions(each.userId, each.permissions));

    room.permissions = otherPermissions.concat(nextUserPermissions);

    return roomMutations.updateRoom(roomId, room);
  },
  toggleUserPermission: async (
    roomId: string,
    userId: string,
    permission: PermissionMarker
  ) => {
    const previousPermissions = await roomQueries.userPermissions(
      roomId,
      userId
    );
    const previouslyPermitted = previousPermissions[permission];

    return roomMutations.modifyUserPermissions(
      roomId,
      userId,
      previouslyPermitted ? "remove" : "add",
      permission
    );
  },
  toggleCoOwner: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(roomId, userId, RoomPermission.CoOwner),
  toggleBlacklisted: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(
      roomId,
      userId,
      RoomPermission.Blacklisted
    ),
  toggleWhitelisted: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(
      roomId,
      userId,
      RoomPermission.Whitelisted
    ),
  toggleMuted: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(roomId, userId, RoomPermission.Muted),
  sendMessage: async (roomId: string, userId: string, content: string) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (!room.meetsPermissionRequirement(userId, RoomPermission.Talk)) {
      throw new roomErrors.RoomForbiddenAction();
    }

    const message = await MessageEntity.mutations.createMessage({
      roomId,
      userId,
      content,
    });

    room.messages.push(message.id);

    return message;
  },
  pinMessage: async (roomId: string, userId: string, messageId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (!room.meetsPermissionRequirement(userId, RoomPermission.CoOwner)) {
      throw new roomErrors.RoomForbiddenAction();
    }

    room.pinMessage(messageId);

    return roomCrud.update(roomId, room);
  },
  removeMessage: async (roomId: string, userId: string, messageId: string) => {
    const room = await roomCrud.read(roomId);
    const message = await MessageEntity.crud.read(messageId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (!message) {
      throw new MessageEntity.errors.MessageNotFoundError();
    }

    const removingOwnMessage = message.userId === userId;

    if (
      !removingOwnMessage &&
      !room.meetsPermissionRequirement(userId, RoomPermission.CoOwner)
    ) {
      throw new roomErrors.RoomForbiddenAction();
    }

    if (removingOwnMessage) {
      await MessageEntity.mutations.deleteMessage(messageId, userId);
    }

    room.removeMessage(messageId);

    return roomCrud.update(roomId, room);
  },
  removeUserMessages: async (roomId: string, userId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (!room.meetsPermissionRequirement(userId, RoomPermission.Owner)) {
      throw new roomErrors.RoomForbiddenAction();
    }

    const messages = await roomQueries.roomMessages(roomId);
    const messagesNotFromUser = messages.filter(
      (each) => each.userId !== userId
    );

    room.messages = messagesNotFromUser.map((each) => each.userId);

    return roomCrud.update(roomId, room);
  },
};

export const roomErrors = {
  RoomIncorrectPasswordError: class extends Error {
    statusCode = 401;
    message = "That is the wrong password.";
  },
  RoomForbiddenAction: class extends Error {
    statusCode = 403;
    message = "User cannot perform that action.";
  },
  RoomForbiddenModification: class extends Error {
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
function serializeRoomPermissions(userId: string, permissions: string) {
  return [userId, permissions].join("/");
}

function deserializeRoomPermissions(permissionsString: string): {
  userId: string;
  permissions: string;
} {
  const [userId, permissions] = permissionsString.split("/");

  return {
    userId,
    permissions,
  };
}
