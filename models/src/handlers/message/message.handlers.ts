import { SUBSCRIBER } from "cache";
import { MessageEntity } from "entities";
import { parseRequest, publishEvent, respondTo } from "../common";
import { MessageEvents } from "./message.events";
import { MessageRequests } from "./message.requests";
import { messageValidators } from "./message.validators";

export const initializeMessageHandlers = () => {
  // Queries
  SUBSCRIBER.subscribe(MessageRequests.GetMessage, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    // TODO: Check if user has permission to retrieve a message prior to retrieval.

    try {
      const { messageId, hydrate } = await messageValidators[
        MessageRequests.GetMessage
      ].validate(args);
      const message = await MessageEntity.queries.message(messageId);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got message.",
        data: {
          message: hydrate ? await message.hydrate() : message.fields,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get message.",
        data: {
          message: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(MessageRequests.GetTotalMessages, async (message) => {
    const { socketId, kind } = parseRequest(message);

    try {
      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got message total.",
        data: {
          total: await MessageEntity.queries.totalMessages(),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get message total.",
        data: {
          total: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(MessageRequests.GetUserMessages, async (message) => {
    const { socketId, kind, args } = parseRequest(message);

    try {
      const { userId } = await messageValidators[
        MessageRequests.GetUserMessages
      ].validate(args);

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got user messages.",
        data: {
          messages: await MessageEntity.queries.userMessages(userId),
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get user messages.",
        data: {
          messages: [],
        },
      });
    }
  });
  SUBSCRIBER.subscribe(
    MessageRequests.GetMessagesByMessageIds,
    async (message) => {
      const { socketId, kind, args } = parseRequest(message);

      try {
        const { messageIds } = await messageValidators[
          MessageRequests.GetMessagesByMessageIds
        ].validate(args);

        return respondTo(socketId, kind, {
          error: false,
          message: "Successfully got messages by message IDs.",
          data: {
            messages: await MessageEntity.queries.messagesByMessageIds(
              ...messageIds
            ),
          },
        });
      } catch (error) {
        return respondTo(socketId, kind, {
          error: true,
          message: "Unable to get messages by message IDs.",
          data: {
            messages: [],
          },
        });
      }
    }
  );
  // Mutations
  SUBSCRIBER.subscribe(MessageRequests.CreateMessage, async (message) => {
    const { socketId, from, kind, args } = parseRequest(message);

    try {
      const messageCreate = await messageValidators[
        MessageRequests.CreateMessage
      ].validate(args);
      const message = await MessageEntity.mutations.createMessage({
        ...messageCreate,
        userId: from,
      });

      await publishEvent(MessageEvents.MessageCreated, {
        message,
      });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully created a message.",
        data: {
          message,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to create a message.",
        data: {
          message: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(MessageRequests.EditMessage, async (message) => {
    const { socketId, from, kind, args } = parseRequest(message);

    try {
      const { messageId, content } = await messageValidators[
        MessageRequests.EditMessage
      ].validate(args);
      const message = await MessageEntity.mutations.editMessage(
        messageId,
        from,
        content
      );

      await publishEvent(MessageEvents.MessageChanged, {
        message,
      });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully edited a message.",
        data: {
          message,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to edit a message.",
        data: {
          message: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(MessageRequests.DeleteMessage, async (message) => {
    const { socketId, from, kind, args } = parseRequest(message);

    try {
      const { messageId } = await messageValidators[
        MessageRequests.DeleteMessage
      ].validate(args);
      const message = await MessageEntity.mutations.deleteMessage(
        messageId,
        from
      );

      await publishEvent(MessageEvents.MessageDeleted, {
        message,
      });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully deleted a message.",
        data: {
          message,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to delete a message.",
        data: {
          message: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(MessageRequests.ReactToMessage, async (message) => {
    const { socketId, from, kind, args } = parseRequest(message);

    try {
      const { messageId, reaction } = await messageValidators[
        MessageRequests.ReactToMessage
      ].validate(args);
      const message = await MessageEntity.mutations.reactToMessage(
        messageId,
        from,
        reaction
      );

      await publishEvent(MessageEvents.MessageChanged, {
        message,
      });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully reacted to a message.",
        data: {
          message,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to react to a message.",
        data: {
          message: null,
        },
      });
    }
  });
  SUBSCRIBER.subscribe(MessageRequests.VoteInMessagePoll, async (message) => {
    const { socketId, from, kind, args } = parseRequest(message);

    try {
      const { messageId, option } = await messageValidators[
        MessageRequests.VoteInMessagePoll
      ].validate(args);
      const message = await MessageEntity.mutations.voteInMessagePoll(
        messageId,
        from,
        option
      );

      await publishEvent(MessageEvents.MessageChanged, {
        message,
      });

      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully reacted to a message.",
        data: {
          message,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to react to a message.",
        data: {
          message: null,
        },
      });
    }
  });
};
