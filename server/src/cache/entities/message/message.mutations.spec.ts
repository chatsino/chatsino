import { MessageEntity } from ".";

describe("Message Mutations", () => {
  describe(MessageEntity.mutations.createMessage.name, () => {
    it.todo("should create a message with user mentions");
  });
  describe(MessageEntity.mutations.editMessage.name, () => {
    it.todo("should change the content of a message with user");
    it.todo("should prevent editing a message that does not exist");
    it.todo(
      "should prevent a user from editing a message that they did not author"
    );
  });
  describe(MessageEntity.mutations.deleteMessage.name, () => {
    it.todo("should remove a message entirely");
    it.todo("should prevent deleting a message that does not exist");
    it.todo(
      "should prevent a user from deleting a message that they did not author"
    );
  });
  describe(MessageEntity.mutations.reactToMessage.name, () => {
    it.todo("should add and remove a reaction");
    it.todo("should prevent reacting to a message that does not exist");
  });
  describe(MessageEntity.mutations.voteInMessagePoll.name, () => {
    it.todo("should add and remove a vote to a message poll");
    it.todo("should prevent voting on a message that does not exist");
    it.todo("should prevent a voting on the same message twice");
  });
});
