import { MessageEntity } from "./message.entity";

describe(MessageEntity.name, () => {
  describe("Queries", () => {
    describe(MessageEntity.queries.allMessages.name, () => {
      it("should return the set of all messages", async () => {});
    });
    describe(MessageEntity.queries.totalMessages.name, () => {
      it("should return the total number of messages", async () => {});
    });
    describe(MessageEntity.queries.userMessages.name, () => {
      it("should return the set of messages sent by a given user", async () => {});
    });
  });

  describe("Mutations", () => {
    describe(MessageEntity.mutations.createMessage.name, () => {
      it("should create a message with user mentions", async () => {});
    });
    describe(MessageEntity.mutations.editMessage.name, () => {
      it("should change the content of a message with user", async () => {});
      it("should prevent editing a message that does not exist", async () => {});
      it("should prevent a user from editing a message that they did not author", async () => {});
    });
    describe(MessageEntity.mutations.deleteMessage.name, () => {
      it("should remove a message entirely", async () => {});
      it("should prevent deleting a message that does not exist", async () => {});
      it("should prevent a user from deleting a message that they did not author", async () => {});
    });
    describe(MessageEntity.mutations.reactToMessage.name, () => {
      it("should add and remove a reaction", async () => {});
      it("should prevent reacting to a message that does not exist", async () => {});
    });
    describe(MessageEntity.mutations.voteInMessagePoll.name, () => {
      it("should add and remove a vote to a message poll", async () => {});
      it("should prevent voting on a message that does not exist", async () => {});
      it("should prevent a voting on the same message twice", async () => {});
    });
  });
});
