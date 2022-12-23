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
    let room: Room;

    beforeEach(async () => {
      user = await server.createUser(CacheGenerator.makeUserCreate());
      room = await server.createRoom(CacheGenerator.makeRoomCreate(user.id));
    });

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
    it("should fail to send a message when invalid data is passed", async () => {
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
});
