import Chance from "chance";
import { initializeCache } from "../cache";
import { initializeDatabase } from "../database";
import {
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
  reactToChatMessage,
  getChatMessage,
  ChatMessage,
} from "./chat-message.model";
import { Chatroom, createChatroom } from "./chatroom.model";
import { Client, createClient } from "./client.model";

const CHANCE = new Chance();

describe("Chat Message Model", () => {
  let client: Client;
  let chatroom: Chatroom;

  beforeAll(async () => {
    await initializeDatabase();
    await initializeCache();

    client = (await createClient(
      CHANCE.word({ length: 8 }),
      CHANCE.word({ length: 8 })
    )) as Client;

    chatroom = (await createChatroom(
      client.id,
      CHANCE.url(),
      CHANCE.word({ length: 8 }),
      CHANCE.word({ length: 12 })
    )) as Chatroom;
  });

  describe("sendChatMessage()", () => {
    it("should add a chat message to the table", async () => {
      const content = "This is a message.";
      const message = await createChatMessage(client.id, chatroom.id, content);
      const expected = {
        id: expect.any(Number),
        clientId: client.id,
        chatroomId: chatroom.id,
        content,
        reactions: {},
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      expect(message).toEqual(expected);
    });
  });
  describe("editChatMessage()", () => {
    it("should change the content of an existing message", async () => {
      const updatedContent = "Updated message.";
      const message = (await createChatMessage(
        client.id,
        chatroom.id,
        "Original message."
      )) as ChatMessage;
      const updatedMessage = (await updateChatMessage(
        message.id,
        updatedContent
      )) as ChatMessage;

      expect(updatedMessage.content).toEqual(updatedContent);
    });
    it("should gracefully handle failures", async () => {
      const message = await updateChatMessage(666666, "Updated message.");

      expect(message).toBeNull();
    });
  });
  describe("deleteChatMessage()", () => {
    it("should remove a chat message", async () => {
      const message = (await createChatMessage(
        client.id,
        chatroom.id,
        "Delete me."
      )) as ChatMessage;
      const deletedMessage = await deleteChatMessage(message.id);
      const retrievedMessage = await getChatMessage(message.id);

      expect(deletedMessage).toEqual(message);
      expect(retrievedMessage).toBeNull();
    });
    it("should gracefully handle failures", async () => {
      const message = await deleteChatMessage(666666);

      expect(message).toBeNull();
    });
  });
  describe("reactToChatMessage()", () => {
    it("should add a reaction to a chat message", async () => {
      const message = (await createChatMessage(
        client.id,
        chatroom.id,
        "React to me."
      )) as ChatMessage;
      const reaction = ":smile:";
      const reactedMessage = (await reactToChatMessage(
        message.id,
        client.id,
        reaction
      )) as ChatMessage;

      expect(reactedMessage.reactions[reaction]).toEqual([client.id]);
    });
    it("should remove a reaction from a chat message when a client already made that reaction", async () => {
      const otherClient = (await createClient(
        CHANCE.word({ length: 8 }),
        CHANCE.word({ length: 8 })
      )) as Client;
      const message = (await createChatMessage(
        client.id,
        chatroom.id,
        "React to me."
      )) as ChatMessage;
      const reaction = ":smile:";
      let reactedMessage = (await reactToChatMessage(
        message.id,
        otherClient.id,
        reaction
      )) as ChatMessage;
      reactedMessage = (await reactToChatMessage(
        message.id,
        client.id,
        reaction
      )) as ChatMessage;

      expect(reactedMessage.reactions[reaction]).toEqual([
        otherClient.id,
        client.id,
      ]);

      reactedMessage = (await reactToChatMessage(
        message.id,
        client.id,
        reaction
      )) as ChatMessage;

      expect(reactedMessage.reactions[reaction]).toEqual([otherClient.id]);
    });
    it("should remove a reaction from a chat message when a client already made that reaction and was the only reaction", async () => {
      const message = (await createChatMessage(
        client.id,
        chatroom.id,
        "React to me."
      )) as ChatMessage;
      const reaction = ":smile:";
      let reactedMessage = (await reactToChatMessage(
        message.id,
        client.id,
        reaction
      )) as ChatMessage;

      expect(reactedMessage.reactions[reaction]).toEqual([client.id]);

      reactedMessage = (await reactToChatMessage(
        message.id,
        client.id,
        reaction
      )) as ChatMessage;

      expect(reactedMessage.reactions[reaction]).toBeUndefined();
    });
    it("should gracefully handle a non-existant chat message", async () => {
      const message = await reactToChatMessage(666666, client.id, ":smile:");

      expect(message).toBeNull();
    });
    it("should gracefully handle failures", async () => {
      const message = await reactToChatMessage(666666, 666666, ":smile:");

      expect(message).toBeNull();
    });
  });
  describe("getChatMessage()", () => {
    it("should retrieve a chat message", async () => {
      const message = (await createChatMessage(
        client.id,
        chatroom.id,
        "Retrieve me."
      )) as ChatMessage;
      const retrievedMessage = await getChatMessage(message.id);

      expect(retrievedMessage).toEqual(message);
    });
    it("should resolve to null when a specified chat message does not exist", async () => {
      const retrievedMessage = await getChatMessage(666666);

      expect(retrievedMessage).toBeNull();
    });
  });
});
