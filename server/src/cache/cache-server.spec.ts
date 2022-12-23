import { initializeCache, initializeDatabase, REDIS } from "persistence";
import { CacheGenerator } from "./cache-generator";
import { CacheServer } from "./cache-server";
import { Room, User } from "./types";

describe(CacheServer.name, () => {
  let server: CacheServer;

  beforeEach(async () => {
    await Promise.all([initializeCache(), initializeDatabase()]);
    await REDIS.flushAll();

    server = new CacheServer();
  });

  describe("Users", () => {
    it("should create a user", async () => {
      const userData = CacheGenerator.makeUserCreate();
      const user = await server.createUser(userData);

      expect(user).toEqual({
        ...userData,
        id: expect.any(Number),
        createdAt: expect.any(String),
        changedAt: expect.any(String),
        chips: 0,
        rooms: [],
        messages: [],
      });
      expect(await server.queryUsername(userData.username)).toBe(user.id);
      expect(await server.queryUserCount()).toBe(1);
      expect(await server.queryUserList()).toEqual([user.id]);
    });
    it("should fail to create a user with a duplicate username", async () => {
      const userData = CacheGenerator.makeUserCreate();
      await server.createUser(userData);

      expect.hasAssertions();

      try {
        await server.createUser(userData);
      } catch (error) {
        expect(error).toBeInstanceOf(CacheServer.errors.ConflictError);
      }
    });
    it("should fail to create a user when invalid data is passed", async () => {
      const userData = CacheGenerator.makeUserCreate();
      delete (userData as any).avatar;

      expect.hasAssertions();

      try {
        await server.createUser(userData);
      } catch (error) {
        expect(error).toBeInstanceOf(CacheServer.errors.ValidationError);
      }
    });
  });
  describe("Rooms", () => {
    let user: User;

    beforeEach(async () => {
      user = await server.createUser(CacheGenerator.makeUserCreate());
    });

    it("should allow a user to create a room", async () => {
      const roomData = CacheGenerator.makeRoomCreate(user.id);
      const room = await server.createRoom(roomData);

      expect(room).toEqual({
        ...roomData,
        id: expect.any(Number),
        ownerId: user.id,
        createdAt: expect.any(String),
        changedAt: expect.any(String),
        permissions: {
          [user.id]: ["owner"],
        },
        users: [],
        messages: [],
        pins: [],
      });
      expect(await server.queryRoomTitle(room.title)).toBe(room.id);
      expect(await server.queryRoomCount()).toBe(1);
      expect(await server.queryRoomList()).toEqual([room.id]);
    });
    it("should fail to create a room with a duplicated title", async () => {
      const roomData = CacheGenerator.makeRoomCreate(user.id);
      await server.createRoom(roomData);

      expect.hasAssertions();

      try {
        await server.createRoom(roomData);
      } catch (error) {
        expect(error).toBeInstanceOf(CacheServer.errors.ConflictError);
      }
    });
    it("should fail to create a room when invalid data is passed", async () => {
      const roomData = CacheGenerator.makeRoomCreate(user.id);
      delete (roomData as any).avatar;

      expect.hasAssertions();

      try {
        await server.createRoom(roomData);
      } catch (error) {
        expect(error).toBeInstanceOf(CacheServer.errors.ValidationError);
      }
    });
  });
  describe("Messages", () => {
    let user: User;
    let anotherUser: User;
    let room: Room;

    beforeEach(async () => {
      user = await server.createUser(CacheGenerator.makeUserCreate());
      anotherUser = await server.createUser(CacheGenerator.makeUserCreate());
      room = await server.createRoom(CacheGenerator.makeRoomCreate(user.id));
    });

    describe("(sending a message)", () => {
      it("should allow a user to message a room", async () => {
        const messageData = CacheGenerator.makeMessageCreate(user.id, room.id);
        const message = await server.sendMessage(messageData);

        expect(message).toEqual({
          ...messageData,
          id: expect.any(Number),
          createdAt: expect.any(String),
          changedAt: expect.any(String),
          authorId: user.id,
          roomId: room.id,
          reactions: {},
        });
        expect(await server.queryMessageCount()).toBe(1);
        expect(await server.queryUserMessages(user.id)).toEqual([message.id]);
        expect(await server.queryRoomMessages(room.id)).toEqual([message.id]);
      });
      it("should prevent a user from sending a message to a room that does not exist", async () => {
        const messageData = CacheGenerator.makeMessageCreate(user.id, -50);

        expect.hasAssertions();

        try {
          await server.sendMessage(messageData);
        } catch (error) {
          expect(error).toBeInstanceOf(CacheServer.errors.NotFoundError);
        }
      });
      it("should prevent sending the same message twice in a row", async () => {
        const messageData = CacheGenerator.makeMessageCreate(user.id, room.id);
        await server.sendMessage(messageData);

        expect.hasAssertions();

        try {
          await server.sendMessage(messageData);
        } catch (error) {
          expect(error).toBeInstanceOf(CacheServer.errors.ConflictError);
        }
      });
      it("should prevent sending a message when invalid data is passed", async () => {
        const messageData = CacheGenerator.makeMessageCreate(user.id, room.id);
        delete (messageData as any).content;

        expect.hasAssertions();

        try {
          await server.sendMessage(messageData);
        } catch (error) {
          expect(error).toBeInstanceOf(CacheServer.errors.ValidationError);
        }
      });
    });
    describe("(editing a message)", () => {
      it("should allow a user to edit their own message", async () => {
        const message = await server.sendMessage(
          CacheGenerator.makeMessageCreate(user.id, room.id)
        );
        const edit = CacheGenerator.makeMessageCreate(user.id, room.id).content;
        const editedMessage = await server.editMessage(
          message.id,
          user.id,
          edit
        );

        expect(editedMessage.id).toBe(message.id);
        expect(editedMessage.content).toBe(edit);
      });
      it("should prevent a user from editing a message that does not exist", async () => {
        const edit = CacheGenerator.makeMessageCreate(user.id, room.id).content;

        expect.hasAssertions();

        try {
          await server.editMessage(-50, user.id, edit);
        } catch (error) {
          expect(error).toBeInstanceOf(CacheServer.errors.NotFoundError);
        }
      });
      it("should prevent a user from editing another user's message", async () => {
        const message = await server.sendMessage(
          CacheGenerator.makeMessageCreate(user.id, room.id)
        );
        const edit = CacheGenerator.makeMessageCreate(user.id, room.id).content;

        expect.hasAssertions();

        try {
          await server.editMessage(message.id, anotherUser.id, edit);
        } catch (error) {
          expect(error).toBeInstanceOf(CacheServer.errors.ForbiddenError);
        }
      });
    });
    describe("(deleting a message)", () => {
      it("should allow a user to delete their own message", async () => {
        const message = await server.sendMessage(
          CacheGenerator.makeMessageCreate(user.id, room.id)
        );

        expect(await server.queryUserMessages(user.id)).toEqual([message.id]);
        expect(await server.queryRoomMessages(room.id)).toEqual([message.id]);

        const deleted = await server.deleteMessage(message.id, user.id);

        expect(deleted).toBe(true);
        expect(await server.queryMessage(message.id)).toBeNull();
        expect(await server.queryUserMessages(user.id)).toEqual([]);
        expect(await server.queryRoomMessages(room.id)).toEqual([]);
      });
      it("should prevent a user from deleting a message that does not exist", async () => {
        expect.hasAssertions();

        try {
          await server.deleteMessage(-500, user.id);
        } catch (error) {
          expect(error).toBeInstanceOf(CacheServer.errors.NotFoundError);
        }
      });
      it("should prevent a user from deleting another user's message", async () => {
        const message = await server.sendMessage(
          CacheGenerator.makeMessageCreate(user.id, room.id)
        );

        expect.hasAssertions();

        try {
          await server.deleteMessage(message.id, anotherUser.id);
        } catch (error) {
          expect(error).toBeInstanceOf(CacheServer.errors.ForbiddenError);
        }
      });
    });
    describe("(pinning a message)", () => {
      it("should allow for a message to be pinned and unpinned", async () => {
        expect(await server.queryRoomPins(room.id)).toEqual([]);

        const message = await server.sendMessage(
          CacheGenerator.makeMessageCreate(user.id, room.id)
        );
        let pinned = await server.toggleMessagePinned(message.id);

        expect(pinned).toBe(true);
        expect(await server.queryRoomPins(room.id)).toEqual([message.id]);

        pinned = await server.toggleMessagePinned(message.id);

        expect(pinned).toBe(false);
        expect(await server.queryRoomPins(room.id)).toEqual([]);
      });
    });
    describe("(reacting to a message)", () => {
      it("should allow for a message to be reacted to", async () => {
        const message = await server.sendMessage(
          CacheGenerator.makeMessageCreate(user.id, room.id)
        );
        const reaction = ":smile:";

        expect(message.reactions[reaction]).toBeUndefined();

        const reacted = await server.reactToMessage(
          message.id,
          user.id,
          reaction
        );

        expect(reacted).toBe(true);
        expect(
          (await server.queryMessage(message.id))?.reactions[reaction]
        ).toEqual([user.id]);

        const reactedNow = await server.reactToMessage(
          message.id,
          user.id,
          reaction
        );

        expect(reactedNow).toBe(false);
        expect(
          (await server.queryMessage(message.id))?.reactions[reaction]
        ).toBeUndefined();
      });
    });
  });
});
