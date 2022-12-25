import { Chance } from "chance";
import { initializeCache, REDIS } from "persistence";
import { MessageEntity } from "./message.entity";
import {
  Room,
  RoomCreate,
  RoomEntity,
  serializeDirectMessageRoomId,
  serializeRoomPermissions,
} from "./room.entity";
import { UserEntity, User } from "./user.entity";

const CHANCE = new Chance();

describe(RoomEntity.name, () => {
  let userA: User;
  let userB: User;
  let roomData: RoomCreate;
  let roomA: Room;
  let roomB: Room;
  let directMessageRoom: Room;

  beforeEach(async () => {
    await initializeCache();
    await REDIS.flushAll();
    await Promise.all([
      UserEntity.createIndex(),
      RoomEntity.createIndex(),
      MessageEntity.createIndex(),
    ]);

    userA = await UserEntity.mutations.createUser({
      avatar: CHANCE.avatar(),
      username: "admin",
    });
    userB = await UserEntity.mutations.createUser({
      avatar: CHANCE.avatar(),
      username: "user",
    });
    roomData = {
      ownerId: userA.id,
      avatar: CHANCE.avatar(),
      title: CHANCE.word(),
      description: CHANCE.sentence(),
      password: "",
    };
    roomA = await RoomEntity.mutations.createRoom(roomData);
    roomB = await RoomEntity.mutations.createRoom({
      ownerId: userB.id,
      avatar: CHANCE.avatar(),
      title: CHANCE.word(),
      description: CHANCE.sentence(),
      password: CHANCE.word(),
    });
    directMessageRoom = await RoomEntity.mutations.createDirectMessageRoom(
      userA.id,
      userB.id
    );
  });

  describe("Queries", () => {
    describe(RoomEntity.queries.allRooms.name, () => {
      it("should return the set of all rooms", async () => {
        const rooms = await RoomEntity.queries.allRooms();

        expect(rooms).toEqual([roomA, roomB]);
      });
    });
    describe(RoomEntity.queries.allPublicRooms.name, () => {
      it("should return the set of non-direct-message rooms without passwords or whitelists", async () => {
        const rooms = await RoomEntity.queries.allPublicRooms();

        expect(rooms).toEqual([roomA]);
      });
    });
    describe(RoomEntity.queries.totalRooms.name, () => {
      it("should return the total number of non-direct-message rooms", async () => {
        const totalRooms = await RoomEntity.queries.totalRooms();

        expect(totalRooms).toBe(2);
      });
    });
    describe(RoomEntity.queries.roomById.name, () => {
      it("should return a room with the specified ID", async () => {
        const room = await RoomEntity.queries.roomById(roomA.id);

        expect(room).toEqual(roomA);
      });
    });
    describe(RoomEntity.queries.roomByRoomTitle.name, () => {
      it("should return a room when the specified title has been used", async () => {
        const existingRoom = await RoomEntity.queries.roomByRoomTitle(
          roomA.title
        );
        const nonexistingRoom = await RoomEntity.queries.roomByRoomTitle(
          CHANCE.string()
        );

        expect(existingRoom).toEqual(roomA);
        expect(nonexistingRoom).toBeNull();
      });
    });
    describe(RoomEntity.queries.userPermissions.name, () => {
      it("should return a user's permissions in a given room", async () => {
        const permissions = await RoomEntity.queries.userPermissions(
          roomA.id,
          userA.id
        );

        expect(permissions.O).toBe(true);
      });
      it("should prevent retrieving user permissions from a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.queries.userPermissions(CHANCE.string(), userA.id);
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
    });
    describe(RoomEntity.queries.meetsRoomPermissionRequirement.name, () => {
      it("should return true/false when the requirement is met/not met", async () => {
        const meetsRequirement =
          await RoomEntity.queries.meetsRoomPermissionRequirement(
            roomA.id,
            userA.id,
            "O"
          );

        expect(meetsRequirement).toBe(true);
      });
      it("should prevent checking the requirement for a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.queries.meetsRoomPermissionRequirement(
            CHANCE.string(),
            userA.id,
            "O"
          );
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
    });
    describe(RoomEntity.queries.roomUsers.name, () => {
      it("should return a list of users that have joined a room", async () => {
        await RoomEntity.mutations.joinRoom(roomA.id, userA.id);

        const users = await RoomEntity.queries.roomUsers(roomA.id);
        const userFields = users[0].fields;

        expect(userFields).toEqual(userA.fields);
      });
      it("should prevent retrieving a list for a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.queries.roomUsers(CHANCE.string());
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
    });
    describe(RoomEntity.queries.roomMessages.name, () => {
      it("should return a list of messages that have been sent to a room", async () => {
        roomA = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userA.id,
          CHANCE.string()
        );

        const [message] = await RoomEntity.queries.roomMessages(roomA.id);

        expect(message.id).toBe(roomA.messages[0]);
      });
      it("should prevent retrieving a list for a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.queries.roomMessages(CHANCE.string());
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
    });
  });

  describe("Mutations", () => {
    describe(RoomEntity.mutations.createRoom.name, () => {
      it("should create a room", async () => {
        expect(roomA.fields).toEqual({
          ...roomData,
          id: expect.any(String),
          createdAt: expect.any(Date),
          changedAt: expect.any(Date),
          permissions: [serializeRoomPermissions(userA.id, "O")],
          users: [],
          messages: [],
          pins: [],
        });
      });
      it("should prevent creating a room with a duplicate title", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.createRoom(roomData);
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomTitleConflictError
          );
        }
      });
    });
    describe(RoomEntity.mutations.createDirectMessageRoom.name, () => {
      it("should create a private room", async () => {
        const roomId = serializeDirectMessageRoomId(userA.id, userB.id);

        expect(directMessageRoom.id).toBe(roomId);
        expect(directMessageRoom.entityId).not.toBe(roomId);
        expect(directMessageRoom.ownerId).toBe("");
        expect(directMessageRoom.title).toBe(
          `DM: ${userA.username} & ${userB.username}`
        );
        expect(directMessageRoom.description).toBe(
          `A private conversation between ${userA.username} and ${userB.username}.`
        );
        expect(directMessageRoom.users).toEqual([userA.id, userB.id]);
      });
      it("should prevent creating a room when either provided user ID is invalid", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.createDirectMessageRoom(userA.id, "FOO");
        } catch (error) {
          expect(error).toBeInstanceOf(UserEntity.errors.UserNotFoundError);
        }

        try {
          await RoomEntity.mutations.createDirectMessageRoom(
            CHANCE.string(),
            userB.id
          );
        } catch (error) {
          expect(error).toBeInstanceOf(UserEntity.errors.UserNotFoundError);
        }
      });
      it("should prevent creating a private room between the two users already exists", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.createDirectMessageRoom(
            userA.id,
            userB.id
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }

        try {
          await RoomEntity.mutations.createDirectMessageRoom(
            userB.id,
            userA.id
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
    });
    describe(RoomEntity.mutations.updateRoom.name, () => {
      it("should change a room", async () => {
        const nextTitle = CHANCE.string();
        const updatedRoom = await RoomEntity.mutations.updateRoom(roomA.id, {
          title: nextTitle,
        });

        expect(updatedRoom.title).toBe(nextTitle);
      });
      it("should prevent changing a room's title to a duplicate", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.updateRoom(roomA.id, {
            title: roomA.title,
            description: CHANCE.sentence(),
          });
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomTitleConflictError
          );
        }
      });
    });
    describe(RoomEntity.mutations.joinRoom.name, () => {
      it("should add a user to a room", async () => {
        const roomWithUser = (await RoomEntity.mutations.joinRoom(
          roomA.id,
          userA.id
        )) as Room;

        expect(roomWithUser.users).toEqual([userA.id]);

        const roomWithoutUser = (await RoomEntity.mutations.joinRoom(
          roomA.id,
          userA.id
        )) as Room;

        expect(roomWithoutUser.users).toEqual([]);
      });
      it("should prevent adding a user to a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.joinRoom(CHANCE.string(), userA.id);
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
      it("should prevent adding user to a room with the wrong password", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.joinRoom(
            roomB.id,
            userA.id,
            CHANCE.string()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomIncorrectPasswordError
          );
        }
      });
      it("should prevent adding user to a room when blacklisted", async () => {
        await RoomEntity.mutations.toggleBlacklisted(
          roomA.id,
          userA.id,
          userB.id
        );

        expect.hasAssertions();

        try {
          await RoomEntity.mutations.joinRoom(roomA.id, userB.id);
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotAllowedError);
        }
      });
      it("should prevent adding user to a room not on the whitelist", async () => {
        await RoomEntity.mutations.toggleWhitelisted(
          roomA.id,
          userA.id,
          userA.id
        );

        expect.hasAssertions();

        try {
          await RoomEntity.mutations.joinRoom(roomA.id, userB.id);
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotAllowedError);
        }
      });
    });
    describe(RoomEntity.mutations.modifyUserPermissions.name, () => {
      it("should change the permissions of a user in a room", async () => {
        expect(roomA.meetsPermissionRequirement(userB.id, "W")).toBe(false);

        let updatedRoom = await RoomEntity.mutations.modifyUserPermissions(
          roomA.id,
          userA.id,
          userB.id,
          "add",
          "W"
        );

        expect(updatedRoom.meetsPermissionRequirement(userB.id, "W")).toBe(
          true
        );

        updatedRoom = await RoomEntity.mutations.modifyUserPermissions(
          roomA.id,
          userA.id,
          userB.id,
          "remove",
          "W"
        );

        expect(updatedRoom.meetsPermissionRequirement(userB.id, "W")).toBe(
          false
        );
      });
      it("should prevent changing the permissions of a user in a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.modifyUserPermissions(
            CHANCE.string(),
            userA.id,
            userB.id,
            "add",
            "M"
          );
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
      it("should prevent a user from changing the permissions of another user when they are not the owner", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.modifyUserPermissions(
            roomA.id,
            userB.id,
            userA.id,
            "add",
            "M"
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenModificationError
          );
        }
      });
    });
    describe(RoomEntity.mutations.sendMessage.name, () => {
      it("should create a message and add it to a room", async () => {
        expect(await RoomEntity.queries.roomMessages(roomA.id)).toEqual([]);

        let updatedRoom = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userA.id,
          CHANCE.sentence()
        );

        expect(updatedRoom.messages).toHaveLength(1);

        updatedRoom = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userA.id,
          CHANCE.sentence()
        );

        expect(updatedRoom.messages).toHaveLength(2);
      });
      it("should prevent sending a message to a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.sendMessage(
            CHANCE.string(),
            userA.id,
            CHANCE.sentence()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
      it("should prevent a user with the wrong password from sending a message to a room", async () => {
        expect.assertions(3);

        expect(roomB.messages).toHaveLength(0);

        const withPassword = await RoomEntity.mutations.sendMessage(
          roomB.id,
          userA.id,
          CHANCE.sentence(),
          roomB.password
        );

        expect(withPassword.messages).toHaveLength(1);

        try {
          await RoomEntity.mutations.sendMessage(
            roomB.id,
            userA.id,
            CHANCE.sentence()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
      it("should prevent a muted user from sending a message to a room", async () => {
        await RoomEntity.mutations.toggleMuted(roomA.id, userA.id, userB.id);

        expect.hasAssertions();

        try {
          await RoomEntity.mutations.sendMessage(
            roomA.id,
            userB.id,
            CHANCE.sentence()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
      it("should prevent a blacklisted user from sending a message to a room", async () => {
        await RoomEntity.mutations.toggleBlacklisted(
          roomA.id,
          userA.id,
          userB.id
        );

        expect.hasAssertions();

        try {
          await RoomEntity.mutations.sendMessage(
            roomA.id,
            userB.id,
            CHANCE.sentence()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
      it("should prevent a non-whitelisted user from sending a message to a room", async () => {
        const room = await RoomEntity.mutations.toggleWhitelisted(
          roomA.id,
          userA.id,
          userA.id
        );

        expect.hasAssertions();

        try {
          await RoomEntity.mutations.sendMessage(
            roomA.id,
            userB.id,
            CHANCE.sentence()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
    });
    describe(RoomEntity.mutations.sendDirectMessage.name, () => {
      it("should create a direct message and add it to a private room", async () => {
        expect(directMessageRoom.messages).toHaveLength(0);

        directMessageRoom = await RoomEntity.mutations.sendDirectMessage(
          userA.id,
          userB.id,
          CHANCE.sentence()
        );

        expect(directMessageRoom.messages).toHaveLength(1);

        directMessageRoom = await RoomEntity.mutations.sendDirectMessage(
          userB.id,
          userA.id,
          CHANCE.sentence()
        );

        expect(directMessageRoom.messages).toHaveLength(2);
      });
      it("should create a new direct message room if this is the first message between two users", async () => {
        userB = await UserEntity.mutations.createUser({
          avatar: CHANCE.avatar(),
          username: CHANCE.word(),
        });

        const messageId = serializeDirectMessageRoomId(userA.id, userB.id);

        expect(await RoomEntity.queries.roomById(messageId)).toBeNull();

        await RoomEntity.mutations.sendDirectMessage(
          userA.id,
          userB.id,
          CHANCE.sentence()
        );

        expect(await RoomEntity.queries.roomById(messageId)).not.toBeNull();
      });
      it("should prevent sending a direct message if either specified user does not exist", async () => {
        expect.assertions(2);

        try {
          await RoomEntity.mutations.sendDirectMessage(
            CHANCE.string(),
            userB.id,
            CHANCE.sentence()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(UserEntity.errors.UserNotFoundError);
        }

        try {
          await RoomEntity.mutations.sendDirectMessage(
            userA.id,
            CHANCE.string(),
            CHANCE.sentence()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(UserEntity.errors.UserNotFoundError);
        }
      });
    });
    describe(RoomEntity.mutations.pinMessage.name, () => {
      it("should add a message to the set of room pins", async () => {
        expect(roomA.pins).toHaveLength(0);

        roomA = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userA.id,
          CHANCE.sentence()
        );

        const [messageId] = roomA.messages;

        roomA = await RoomEntity.mutations.pinMessage(
          roomA.id,
          userA.id,
          messageId
        );

        expect(roomA.pins).toHaveLength(1);
        expect(roomA.pins[0]).toBe(messageId);

        roomA = await RoomEntity.mutations.pinMessage(
          roomA.id,
          userA.id,
          messageId
        );
        expect(roomA.pins).toHaveLength(0);
      });
      it("should prevent pinning a message that is not in a room", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.pinMessage(
            roomA.id,
            userA.id,
            CHANCE.string()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomMessageNotFoundError
          );
        }
      });
      it("should prevent adding a message to the set of room pins of a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.pinMessage(
            CHANCE.string(),
            userA.id,
            CHANCE.string()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
      it("should prevent a user who is not a co-owner from pinning a message of a room", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.pinMessage(
            roomA.id,
            userB.id,
            CHANCE.string()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
    });
    describe(RoomEntity.mutations.removeMessage.name, () => {
      it("should remove a message from a room without deleting when co-owner and not the author", async () => {
        roomA = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userB.id,
          CHANCE.sentence()
        );
        const [messageId] = roomA.messages;

        roomA = await RoomEntity.mutations.removeMessage(
          roomA.id,
          userA.id,
          messageId
        );

        expect(roomA.messages).toHaveLength(0);
      });
      it("should remove a message from a room with deleting when author is deleting", async () => {
        roomA = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userB.id,
          CHANCE.sentence()
        );
        const [messageId] = roomA.messages;

        roomA = await RoomEntity.mutations.removeMessage(
          roomA.id,
          userB.id,
          messageId
        );

        expect(roomA.messages).toHaveLength(0);
      });
      it("should prevent removing a message from a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.removeMessage(
            CHANCE.string(),
            userA.id,
            CHANCE.string()
          );
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
      it("should prevent a user from removing a message if they are not allowed", async () => {
        roomA = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userA.id,
          CHANCE.sentence()
        );
        const [messageId] = roomA.messages;

        expect.hasAssertions();

        try {
          roomA = await RoomEntity.mutations.removeMessage(
            roomA.id,
            userB.id,
            messageId
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
    });
    describe(RoomEntity.mutations.removeUserMessages.name, () => {
      it("should remove all messages sent by a given user to a room", async () => {
        roomA = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userA.id,
          CHANCE.sentence()
        );
        roomA = await RoomEntity.mutations.sendMessage(
          roomA.id,
          userA.id,
          CHANCE.sentence()
        );

        expect(roomA.messages).toHaveLength(2);

        roomA = await RoomEntity.mutations.removeUserMessages(
          roomA.id,
          userA.id
        );

        expect(roomA.messages).toHaveLength(0);
      });
      it("should prevent removing messages from a room that does not exist", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.removeUserMessages(
            CHANCE.string(),
            userA.id
          );
        } catch (error) {
          expect(error).toBeInstanceOf(RoomEntity.errors.RoomNotFoundError);
        }
      });
      it("should prevent removing messages from a room if not the owner", async () => {
        expect.hasAssertions();

        try {
          await RoomEntity.mutations.removeUserMessages(roomA.id, userB.id);
        } catch (error) {
          expect(error).toBeInstanceOf(
            RoomEntity.errors.RoomForbiddenActionError
          );
        }
      });
    });
  });
});
