import { messageCrud } from "./message.crud";
import { Message } from "./message.schema";
import { MessageCreate } from "./message.types";
import { messageErrors } from "./message.errors";

export const messageMutations = {
  createMessage: async (data: MessageCreate) => {
    const mentions = await Message.determineMentions(data.content);

    return messageCrud.create({
      ...data,
      mentions,
    });
  },
  editMessage: async (messageId: string, userId: string, content: string) => {
    const message = await messageCrud.read(messageId);

    if (userId !== message.userId) {
      throw new messageErrors.ForbiddenEditError();
    }

    if (content === message.content) {
      return;
    }

    const mentions = await Message.determineMentions(content);
    message.content = content;
    message.mentions = mentions;

    return messageCrud.update(messageId, message);
  },
  deleteMessage: async (messageId: string, userId: string) => {
    const message = await messageCrud.read(messageId);

    if (userId !== message.userId) {
      throw new messageErrors.ForbiddenDeleteError();
    }

    return messageCrud.delete(messageId);
  },
  reactToMessage: async (
    messageId: string,
    userId: string,
    reaction: string
  ) => {
    const message = await messageCrud.read(messageId);

    message.react(userId, reaction);

    return messageCrud.update(messageId, message);
  },
  voteInMessagePoll: async (
    messageId: string,
    userId: string,
    option: string
  ) => {
    const message = await messageCrud.read(messageId);
    const voted = message.voteInPoll(userId, option);

    if (voted) {
      return messageCrud.update(messageId, message);
    }
  },
};
