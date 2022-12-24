import { executeCommand } from "cache/object-mapper";
import { rightNow } from "helpers";
import { Client, Entity, Schema } from "redis-om";
import { User, UserEntity, userErrors } from "./user.entity";

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

export const RoomPermissions: Record<string, PermissionMarker> = {
  Owner: "O",
  CoOwner: "C",
  Guest: "G",
  Talk: "T",
  Muted: "M",
  Blacklisted: "B",
  Whitelisted: "W",
};

export type OnlyRoomPermission<S> = S extends ""
  ? unknown
  : S extends `${PermissionMarker}${infer Tail}`
  ? OnlyRoomPermission<Tail>
  : never;

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

export class Room extends Entity {}

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

    return rooms.filter((room) => {
      const whitelistActive = room.permissions.some((each) =>
        deserializeRoomPermissions(each).permissions.includes(
          RoomPermissions.Whitelisted
        )
      );

      return !(room.password || whitelistActive);
    });
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
    const user = await UserEntity.crud.read(userId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (!user) {
      throw new UserEntity.errors.UserNotFoundError();
    }

    const roomPermissions = room.permissions.map((each) =>
      deserializeRoomPermissions(each)
    );

    return (
      roomPermissions.find((each) => each.userId === userId)?.permissions ?? ""
    );
  },
  meetsRoomPermissionRequirement: async <T extends string>(
    roomId: string,
    userId: string,
    requirement: T & OnlyRoomPermission<T>
  ) => {
    const room = await roomCrud.read(roomId);
    const user = await UserEntity.crud.read(userId);

    if (!room || !user) {
      return false;
    }

    const roomPermissions = room.permissions.map((each) =>
      deserializeRoomPermissions(each)
    );
    const userPermissions =
      roomPermissions.find((each) => each.userId === userId)?.permissions ?? "";

    const isOwner = userPermissions.includes(RoomPermissions.Owner);
    const isCoOwner = userPermissions.includes(RoomPermissions.CoOwner);
    const ownsOrCoOwns = isOwner || isCoOwner;
    const meetsGuestRequirement = () => {
      if (ownsOrCoOwns) {
        return true;
      }

      const whitelistActive = roomPermissions.some((each) =>
        each.permissions.includes(RoomPermissions.Whitelisted)
      );

      if (whitelistActive) {
        const onWhitelist = userPermissions.includes(
          RoomPermissions.Whitelisted
        );

        return onWhitelist;
      }

      const onBlacklist = userPermissions.includes(RoomPermissions.Blacklisted);

      return !onBlacklist;
    };

    if (requirement === RoomPermissions.Owner) {
      return isOwner;
    }

    if (requirement === RoomPermissions.CoOwner) {
      return ownsOrCoOwns;
    }

    if (requirement === RoomPermissions.Guest) {
      return meetsGuestRequirement();
    }

    if (requirement === RoomPermissions.Talk) {
      const isMuted = userPermissions.includes(RoomPermissions.Muted);

      return meetsGuestRequirement() && !isMuted;
    }

    return true;
  },
  roomUsers: async (roomId: string) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    return UserEntity.crud.readList(...room.users);
  },
};

export const roomMutations = {
  createRoomEntity: async (data: RoomCreate) => {
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
  updateRoomEntity: async (roomId: string, data: Partial<Room>) => {
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
    const user = await UserEntity.crud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    if (room.users.includes(userId)) {
      return roomMutations.leaveRoom(roomId, userId);
    }

    if (!user) {
      throw new userErrors.UserNotFoundError();
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
      : roomMutations.updateRoomEntity(roomId, room);
  },
  modifyUserPermissions: async <M extends string>(
    roomId: string,
    userId: string,
    operation: "add" | "remove",
    markers: M & OnlyRoomPermission<M>
  ) => {
    const room = await roomCrud.read(roomId);

    if (!room) {
      throw new roomErrors.RoomNotFoundError();
    }

    const user = await UserEntity.crud.read(roomId);

    if (!user) {
      throw new userErrors.UserNotFoundError();
    }

    const hasOwnerPermission = await roomQueries.meetsRoomPermissionRequirement(
      roomId,
      userId,
      "O"
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

    return roomMutations.updateRoomEntity(roomId, room);
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
    const previousMarkerExists = previousPermissions.includes(permission);

    return roomMutations.modifyUserPermissions(
      roomId,
      userId,
      previousMarkerExists ? "remove" : "add",
      permission
    );
  },
  toggleCoOwner: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(roomId, userId, RoomPermissions.CoOwner),
  toggleBlacklisted: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(
      roomId,
      userId,
      RoomPermissions.Blacklisted
    ),
  toggleWhitelisted: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(
      roomId,
      userId,
      RoomPermissions.Whitelisted
    ),
  toggleMuted: (roomId: string, userId: string) =>
    roomMutations.toggleUserPermission(roomId, userId, RoomPermissions.Muted),
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
