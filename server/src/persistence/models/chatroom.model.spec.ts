import Chance from "chance";
import { initializeCache } from "../cache";
import { initializeDatabase } from "../database";
import {
  createChatroom,
  updateChatroom,
  deleteChatroom,
  deleteAllChatrooms,
  getChatroom,
  getAllChatrooms,
  Chatroom,
} from "./chatroom.model";
import { Client, createClient } from "./client.model";

const CHANCE = new Chance();

describe("Chatroom Model", () => {
  let client: Client;

  beforeAll(async () => {
    await initializeDatabase();
    await initializeCache();

    client = (await createClient(
      CHANCE.word({ length: 8 }),
      CHANCE.word({ length: 8 })
    )) as Client;
  });

  beforeEach(async () => {
    await deleteAllChatrooms();
  });

  describe("createChatroom()", () => {
    it("should add a chatroom to the table", async () => {
      const chatroomData = {
        avatar: CHANCE.url(),
        title: CHANCE.word({ length: 8 }),
        description: CHANCE.word({ length: 12 }),
      };
      const chatroom = await createChatroom(client.id, chatroomData);

      expect(chatroom).toEqual({
        id: expect.any(Number),
        avatar: chatroomData.avatar,
        title: chatroomData.title,
        description: chatroomData.description,
        password: null,
        blacklist: null,
        whitelist: null,
        createdBy: client.id,
        updatedBy: client.id,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("updateChatroom()", () => {
    it("should modify an existing chatroom", async () => {
      const chatroomData = {
        avatar: CHANCE.url(),
        title: CHANCE.word({ length: 8 }),
        description: CHANCE.word({ length: 12 }),
      };
      const chatroom = (await createChatroom(
        client.id,
        chatroomData
      )) as Chatroom;

      expect(chatroom.password).toBeNull();

      const password = "password";
      const updatedChatroom = (await updateChatroom(chatroom.id, {
        password,
      })) as Chatroom;

      expect(updatedChatroom.password).toBe(password);
    });

    it("should fail gracefully when trying to update a non-existent chatroom", async () => {
      const updatedChatroom = await updateChatroom(666666, {
        title: "My Chatroom",
      });

      expect(updatedChatroom).toBeNull();
    });
  });

  describe("deleteChatroom()", () => {
    it("should remove a chatroom from the table", async () => {
      const chatroomData = {
        avatar: CHANCE.url(),
        title: CHANCE.word({ length: 8 }),
        description: CHANCE.word({ length: 12 }),
      };
      const chatroom = (await createChatroom(
        client.id,
        chatroomData
      )) as Chatroom;
      const deletedChatroom = await deleteChatroom(chatroom.id);

      expect(deletedChatroom).toEqual(chatroom);
    });

    it("should fail gracefully when trying to delete a non-existent chatroom", async () => {
      const deletedChatroom = await deleteChatroom(666666);

      expect(deletedChatroom).toBeNull();
    });
  });

  describe("deleteAllChatrooms()", () => {
    it("should remove all chatrooms from the table", async () => {
      const chatroomData = {
        avatar: CHANCE.url(),
        description: CHANCE.word({ length: 12 }),
      };
      const chatroomA = (await createChatroom(client.id, {
        title: CHANCE.word({ length: 8 }),
        ...chatroomData,
      })) as Chatroom;
      const chatroomB = (await createChatroom(client.id, {
        title: CHANCE.word({ length: 8 }),
        ...chatroomData,
      })) as Chatroom;
      const chatrooms = await getAllChatrooms();

      expect(chatrooms).toEqual([chatroomA, chatroomB]);

      const deletedChatrooms = await deleteAllChatrooms();

      expect(deletedChatrooms).toEqual([chatroomA, chatroomB]);

      const remainingChatrooms = await getAllChatrooms();

      expect(remainingChatrooms).toEqual([]);
    });
  });

  describe("getChatroom()", () => {
    it("should resolve with the specified chatroom", async () => {
      const chatroomData = {
        avatar: CHANCE.url(),
        title: CHANCE.word({ length: 8 }),
        description: CHANCE.word({ length: 12 }),
      };
      const chatroom = (await createChatroom(
        client.id,
        chatroomData
      )) as Chatroom;
      const retrievedChatroom = await getChatroom(chatroom.id);

      expect(retrievedChatroom).toEqual(chatroom);
    });

    it("should fail gracefully when trying to retrieve a non-existent chatroom", async () => {
      const retrievedChatroom = await getChatroom(666666);

      expect(retrievedChatroom).toBeNull();
    });
  });

  describe("getAllChatrooms()", () => {
    it("should retrieve a collection of all chatrooms", async () => {
      const chatroomData = {
        avatar: CHANCE.url(),
        description: CHANCE.word({ length: 12 }),
      };
      const chatroomA = (await createChatroom(client.id, {
        title: CHANCE.word({ length: 8 }),
        ...chatroomData,
      })) as Chatroom;
      const chatroomB = (await createChatroom(client.id, {
        title: CHANCE.word({ length: 8 }),
        ...chatroomData,
      })) as Chatroom;
      const chatrooms = await getAllChatrooms();

      expect(chatrooms).toEqual([chatroomA, chatroomB]);
    });
  });
});
