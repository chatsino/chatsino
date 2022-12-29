import { initializeCache, CACHE } from "cache";
import { Chance } from "chance";
import { Room, RoomCreate, RoomEntity } from ".";
import { MessageEntity } from "../message";
import { User, UserEntity } from "../user";

const CHANCE = new Chance();

describe("Room Queries", () => {
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
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
        expect(error).toBeInstanceOf(RoomEntity.errors.NotFoundError);
      }
    });
  });
});
