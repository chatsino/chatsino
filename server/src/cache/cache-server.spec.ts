import { initializeCache, initializeDatabase, REDIS } from "persistence";
import { CacheGenerator } from "./cache-generator";
import { CacheServer } from "./cache-server";
import { User } from "./types";

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
        chips: 0,
        rooms: [],
        createdAt: expect.any(String),
        changedAt: expect.any(String),
      });
      expect(await server.queryUsername(userData.username)).toBe(user.id);
      expect(await server.queryUserCount()).toBe(1);
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
      const roomData = CacheGenerator.makeRoomCreate();
      const room = await server.createRoom(user.id, roomData);

      expect(room).toEqual({
        ...roomData,
        id: expect.any(Number),
        ownerId: user.id,
        createdAt: expect.any(String),
        changedAt: expect.any(String),
        permissions: {
          [user.id]: ["owner"],
        },
      });
      expect(await server.queryRoomTitle(room.title)).toBe(room.id);
      expect(await server.queryRoomCount()).toBe(1);
    });
    it("should fail to create a room with a duplicated title", async () => {
      const roomData = CacheGenerator.makeRoomCreate();
      await server.createRoom(user.id, roomData);

      expect.hasAssertions();

      try {
        await server.createRoom(user.id, roomData);
      } catch (error) {
        expect(error).toBeInstanceOf(CacheServer.errors.ConflictError);
      }
    });
    it("should fail to create a room when invalid data is passed", async () => {
      const roomData = CacheGenerator.makeRoomCreate();
      delete (roomData as any).avatar;

      expect.hasAssertions();

      try {
        await server.createRoom(user.id, roomData);
      } catch (error) {
        expect(error).toBeInstanceOf(CacheServer.errors.ValidationError);
      }
    });
  });
});
