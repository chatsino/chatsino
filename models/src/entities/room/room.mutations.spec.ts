import { initializeCache, CACHE } from "cache";
import { Chance } from "chance";
import { Room, RoomCreate, RoomEntity } from ".";
import { MessageEntity } from "../message";
import { User, UserEntity } from "../user";

const CHANCE = new Chance();

describe("Room Mutations", () => {
  let userA: User;
  let userB: User;
  let roomData: RoomCreate;
  let roomA: Room;
  let roomB: Room;
  let directMessageRoom: Room;

  beforeEach(async () => {
    await initializeCache();
    await CACHE.flushAll();
    await Promise.all([
      UserEntity.createIndex(),
      RoomEntity.createIndex(),
      MessageEntity.createIndex(),
    ]);

    userA = await UserEntity.mutations.createUser({
      avatar: CHANCE.avatar(),
      username: "admin",
      password: CHANCE.string({ length: 8 }),
    });
    userB = await UserEntity.mutations.createUser({
      avatar: CHANCE.avatar(),
      username: "user",
      password: CHANCE.string({ length: 8 }),
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

  describe(RoomEntity.mutations.createRoom.name, () => {
    it("should create a room", async () => {
      expect(roomA.fields).toEqual({
        ...roomData,
        id: expect.any(String),
        createdAt: expect.any(Date),
        changedAt: expect.any(Date),
        permissions: [Room.serializePermissions(userA.id, "O")],
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
        expect(error).toBeInstanceOf(RoomEntity.errors.TitleConflictError);
      }
    });
  });
  describe(RoomEntity.mutations.createDirectMessageRoom.name, () => {
    it("should create a private room", async () => {
      const roomId = Room.serializeDirectMessageRoomId(userA.id, userB.id);

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
        expect(error).toBeInstanceOf(UserEntity.errors.NotFoundError);
      }

      try {
        await RoomEntity.mutations.createDirectMessageRoom(
          CHANCE.string(),
          userB.id
        );
      } catch (error) {
        expect(error).toBeInstanceOf(UserEntity.errors.NotFoundError);
      }
    });
    it("should prevent creating a private room between the two users already exists", async () => {
      expect.hasAssertions();

      try {
        await RoomEntity.mutations.createDirectMessageRoom(userA.id, userB.id);
      } catch (error) {
        expect(error).toBeInstanceOf(
          RoomEntity.errors.UserForbiddenActionError
        );
      }

      try {
        await RoomEntity.mutations.createDirectMessageRoom(userB.id, userA.id);
      } catch (error) {
        expect(error).toBeInstanceOf(
          RoomEntity.errors.UserForbiddenActionError
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
        expect(error).toBeInstanceOf(RoomEntity.errors.TitleConflictError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.IncorrectPasswordError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.UserNotAllowedError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.UserNotAllowedError);
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

      expect(updatedRoom.meetsPermissionRequirement(userB.id, "W")).toBe(true);

      updatedRoom = await RoomEntity.mutations.modifyUserPermissions(
        roomA.id,
        userA.id,
        userB.id,
        "remove",
        "W"
      );

      expect(updatedRoom.meetsPermissionRequirement(userB.id, "W")).toBe(false);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
          RoomEntity.errors.UserForbiddenModificationError
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
          RoomEntity.errors.UserForbiddenActionError
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
          RoomEntity.errors.UserForbiddenActionError
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
          RoomEntity.errors.UserForbiddenActionError
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
          RoomEntity.errors.UserForbiddenActionError
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
        password: CHANCE.string({ length: 8 }),
      });

      const messageId = Room.serializeDirectMessageRoomId(userA.id, userB.id);

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
        expect(error).toBeInstanceOf(UserEntity.errors.NotFoundError);
      }

      try {
        await RoomEntity.mutations.sendDirectMessage(
          userA.id,
          CHANCE.string(),
          CHANCE.sentence()
        );
      } catch (error) {
        expect(error).toBeInstanceOf(UserEntity.errors.NotFoundError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.MessageNotFoundError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
          RoomEntity.errors.UserForbiddenActionError
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
          RoomEntity.errors.UserForbiddenActionError
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

      roomA = await RoomEntity.mutations.removeUserMessages(roomA.id, userA.id);

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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
      }
    });
    it("should prevent removing messages from a room if not the owner", async () => {
      expect.hasAssertions();

      try {
        await RoomEntity.mutations.removeUserMessages(roomA.id, userB.id);
      } catch (error) {
        expect(error).toBeInstanceOf(
          RoomEntity.errors.UserForbiddenActionError
        );
      }
    });
  });
});
