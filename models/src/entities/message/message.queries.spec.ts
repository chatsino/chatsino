import { MessageEntity } from ".";

describe("Message Queries", () => {
  describe(MessageEntity.queries.allMessages.name, () => {
    it.todo("should return the set of all messages");
  });
  describe(MessageEntity.queries.totalMessages.name, () => {
    it.todo("should return the total number of messages");
  });
  describe(MessageEntity.queries.userMessages.name, () => {
    it.todo("should return the set of messages sent by a given user");
  });
});
