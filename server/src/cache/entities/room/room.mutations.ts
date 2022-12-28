import { MessageEntity } from "../message";
import { UserEntity, UserNotFoundError } from "../user";
import { roomCrud } from "./room.crud";
import { roomQueries } from "./room.queries";
import { Room } from "./room.schema";
import {
  OnlyPermissionMarker,
  PermissionMarker,
  RoomCreate,
  RoomForbiddenActionError,
  RoomForbiddenModificationError,
  RoomIncorrectPasswordError,
  RoomNotAllowedError,
  RoomPermission,
  RoomTitleConflictError,
} from "./room.types";

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
      throw new RoomTitleConflictError();
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

    const roomId = Room.serializeDirectMessageRoomId(userIdA, userIdB);
    const existingDirectMessageRoom = await roomQueries.roomById(roomId);

    if (existingDirectMessageRoom) {
      throw new RoomForbiddenActionError();
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
        throw new RoomTitleConflictError();
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
      throw new RoomIncorrectPasswordError();
    }

    if (!room.meetsPermissionRequirement(userId, "G")) {
      throw new RoomNotAllowedError();
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
      throw new RoomForbiddenModificationError();
    }

    const roomPermissionsBeforeChange = room.permissions.map(
      Room.deserializePermissions
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
      .map((each) => Room.serializePermissions(each.userId, each.permissions));

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
      throw new RoomForbiddenActionError();
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
      Room.serializeDirectMessageRoomId(sendingUserId, receivingUserId)
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
      throw new RoomForbiddenActionError();
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
      throw new RoomForbiddenActionError();
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
      throw new RoomForbiddenActionError();
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
