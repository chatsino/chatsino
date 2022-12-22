import { initializeCache, initializeDatabase, REDIS } from "persistence";
import { CacheServer } from "./cache-server";
import { CacheGenerator } from "./cache-generator";
import { ValidationError } from "yup";

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
        expect(error).toBeInstanceOf(ValidationError);
      }
    });
  });
});
