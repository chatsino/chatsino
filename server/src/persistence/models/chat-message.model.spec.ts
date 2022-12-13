import Chance from "chance";
import { initializeCache } from "../cache";
import { initializeDatabase } from "../database";
import {
  createChatMessage,
  readChatMessage,
  readChatMessageList,
  updateChatMessage,
  deleteChatMessage,
  deleteAllChatMessages,
  editChatMessage,
  reactToChatMessage,
  ChatMessage,
} from "./chat-message.model";
import { Chatroom, createChatroom } from "./chatroom.model";
import { Client, createClient } from "./client.model";

const CHANCE = new Chance();

describe("Chat Message Model", () => {
  let client: Client;
  let chatroomA: Chatroom;
  let chatroomB: Chatroom;

  beforeAll(async () => {
    await initializeDatabase();
    await initializeCache();
  });

  beforeEach(async () => {
    client = (await createClient(
      CHANCE.word({ length: 8 }),
      CHANCE.word({ length: 8 })
    )) as Client;

    chatroomA = (await createChatroom(client.id, {
      avatar: CHANCE.url(),
      title: CHANCE.word({ length: 8 }),
      description: CHANCE.word({ length: 12 }),
    })) as Chatroom;

    chatroomB = (await createChatroom(client.id, {
      avatar: CHANCE.url(),
      title: CHANCE.word({ length: 8 }),
      description: CHANCE.word({ length: 12 }),
    })) as Chatroom;

    await deleteAllChatMessages();
  });

  describe("CRUD", () => {
    describe(createChatMessage.name, () => {
      it("should add a chat message to the table", async () => {
        const content = "This is a message.";
        const message = await createChatMessage(
          client.id,
          chatroomA.id,
          content
        );
        const expected = {
          id: expect.any(Number),
          clientId: client.id,
          chatroomId: chatroomA.id,
          content,
          reactions: {},
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        };

        expect(message).toEqual(expected);
      });
    });

    describe(readChatMessage.name, () => {
      it("should retrieve a chat message", async () => {
        const message = (await createChatMessage(
          client.id,
          chatroomA.id,
          "Retrieve me."
        )) as ChatMessage;
        const retrievedMessage = await readChatMessage(message.id);

        expect(retrievedMessage).toEqual(message);
      });

      it("should resolve to null when a specified chat message does not exist", async () => {
        const retrievedMessage = await readChatMessage(666666);

        expect(retrievedMessage).toBeNull();
      });
    });

    describe(readChatMessageList.name, () => {
      it("should retrieve a collection of all chat messages", async () => {
        const messageA = await createChatMessage(
          client.id,
          chatroomA.id,
          "Foo"
        );
        const messageB = await createChatMessage(
          client.id,
          chatroomB.id,
          "Bar"
        );
        const messages = await readChatMessageList();

        expect(messages).toEqual([messageA, messageB]);
      });

      it("should retrieve a collection of all chat messages belonging to a given chatroom", async () => {
        const messageA = await createChatMessage(
          client.id,
          chatroomA.id,
          "Foo"
        );
        const messageB = await createChatMessage(
          client.id,
          chatroomB.id,
          "Bar"
        );
        const messages = await readChatMessageList(chatroomA.id);

        expect(messages).toEqual([messageA]);
      });
    });

    describe(updateChatMessage.name, () => {
      it("should modify an existing chat message", async () => {
        const updatedContent = "Updated message.";
        const message = (await createChatMessage(
          client.id,
          chatroomA.id,
          "Original message."
        )) as ChatMessage;
        const updatedMessage = (await updateChatMessage(message.id, {
          content: updatedContent,
        })) as ChatMessage;

        expect(updatedMessage.content).toEqual(updatedContent);
      });

      it("should gracefully handle failures", async () => {
        const message = await updateChatMessage(666666, {
          content: "Updated message.",
          reactions: {},
        });

        expect(message).toBeNull();
      });
    });

    describe(deleteChatMessage.name, () => {
      it("should remove a chat message", async () => {
        const message = (await createChatMessage(
          client.id,
          chatroomA.id,
          "Delete me."
        )) as ChatMessage;
        const deletedMessage = await deleteChatMessage(message.id);
        const retrievedMessage = await readChatMessage(message.id);

        expect(deletedMessage).toEqual(message);
        expect(retrievedMessage).toBeNull();
      });

      it("should gracefully handle failures", async () => {
        const message = await deleteChatMessage(666666);

        expect(message).toBeNull();
      });
    });

    describe(deleteAllChatMessages.name, () => {
      it("should remove a collection of all chat messages", async () => {
        const messageA = await createChatMessage(
          client.id,
          chatroomA.id,
          "Foo"
        );
        const messageB = await createChatMessage(
          client.id,
          chatroomB.id,
          "Bar"
        );
        const messages = await readChatMessageList();

        expect(messages).toEqual([messageA, messageB]);

        const deletedMessages = await deleteAllChatMessages();

        expect(deletedMessages).toEqual([messageA, messageB]);

        const remainingMessages = await readChatMessageList();

        expect(remainingMessages).toEqual([]);
      });

      it("should remove a collection of all chat messages belonging to a given chatroom", async () => {
        const messageA = await createChatMessage(
          client.id,
          chatroomA.id,
          "Foo"
        );
        const messageB = await createChatMessage(
          client.id,
          chatroomB.id,
          "Bar"
        );
        const messages = await readChatMessageList();

        expect(messages).toEqual([messageA, messageB]);

        const deletedMessages = await deleteAllChatMessages(chatroomB.id);

        expect(deletedMessages).toEqual([messageB]);

        const remainingMessages = await readChatMessageList();

        expect(remainingMessages).toEqual([messageA]);
      });
    });
  });

  describe(editChatMessage.name, () => {
    it("should change the content of an existing message", async () => {
      const updatedContent = "Updated message.";
      const message = (await createChatMessage(
        client.id,
        chatroomA.id,
        "Original message."
      )) as ChatMessage;
      const updatedMessage = (await editChatMessage(
        message.id,
        updatedContent
      )) as ChatMessage;

      expect(updatedMessage.content).toEqual(updatedContent);
    });
  });

  describe(reactToChatMessage.name, () => {
    it("should add a reaction to a chat message", async () => {
      const message = (await createChatMessage(
        client.id,
        chatroomA.id,
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
        chatroomA.id,
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
        chatroomA.id,
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

    it("should gracefully handle a non-existent chat message", async () => {
      const message = await reactToChatMessage(666666, client.id, ":smile:");

      expect(message).toBeNull();
    });

    it("should gracefully handle failures", async () => {
      const message = await reactToChatMessage(666666, 666666, ":smile:");

      expect(message).toBeNull();
    });
  });
});
