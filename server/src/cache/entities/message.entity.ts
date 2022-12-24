import { executeCommand } from "cache/object-mapper";
import { rightNow } from "helpers";
import { Client, Entity, Schema } from "redis-om";
import { UserEntity } from "./user.entity";

export interface Message {
  id: string;
  userId: string;
  roomId: string;
  createdAt: string;
  changedAt: string;
  content: string;
  reactions: string[];
  poll: string[];
  mentions: string[];
}

export type MessageCreate = {
  roomId: string;
  userId: string;
  content: string;
  mentions?: string[];
};

export type MessageReaction = {
  reaction: string;
  users: string[];
};

export type MessagePollOption = {
  option: string;
  votes: string[];
};

export class Message extends Entity {
  public get isPoll() {
    return this.poll.length > 0;
  }

  public getFormattedAuthor() {
    return UserEntity.crud.read(this.userId);
  }

  public getHydratedReactions() {
    const deserialized = deserializeMessageReactions(this.reactions);

    return Promise.all(
      deserialized.map(async ({ reaction, users }) => ({
        reaction,
        users: await UserEntity.crud.readList(...users),
      }))
    );
  }

  public getFormattedPoll() {
    const deserialized = deserializeMessagePollOptions(this.poll);

    return this.isPoll
      ? null
      : {
          question: this.content,
          options: deserialized,
        };
  }

  public async getHydratedPoll() {
    const poll = this.getFormattedPoll();

    if (!poll) {
      return null;
    }

    return {
      question: poll.question,
      options: await Promise.all(
        poll.options.map(async ({ option, votes }) => ({
          option,
          votes: await UserEntity.crud.readList(...votes),
        }))
      ),
    };
  }

  public getHydratedMentions() {
    return Promise.all(
      this.mentions.map((userId) => UserEntity.crud.read(userId))
    );
  }

  public voteInPoll(userId: string, option: string) {
    const poll = this.getFormattedPoll();

    if (!poll) {
      return false;
    }

    const pollOption = poll.options.find((each) => each.option === option);

    if (!pollOption) {
      return false;
    }

    if (pollOption.votes.includes(userId)) {
      return false;
    }

    pollOption.votes.push(userId);

    this.poll = serializeMessagePollOptions(poll.options);

    return true;
  }

  public react(userId: string, reaction: string) {
    const reactionLookup = deserializeMessageReactions(this.reactions).reduce(
      (prev, next) => {
        prev[next.reaction] = next.users;
        return prev;
      },
      {} as Record<string, string[]>
    );

    if (!reactionLookup[reaction]) {
      reactionLookup[reaction] = [userId];
      return true;
    }

    const previouslyReacted = reactionLookup[reaction].includes(userId);

    if (previouslyReacted) {
      reactionLookup[reaction] = reactionLookup[reaction].filter(
        (each) => each !== userId
      );
    } else {
      reactionLookup[reaction].push(userId);
    }

    this.reactions = serializeMessageReactions(
      Object.entries(reactionLookup).map(([reaction, users]) => ({
        reaction,
        users,
      }))
    );

    return !previouslyReacted;
  }
}

export const messageSchema = new Schema(Message, {
  id: {
    type: "string",
  },
  userId: {
    type: "string",
  },
  roomId: {
    type: "string",
  },
  createdAt: {
    type: "date",
  },
  changedAt: {
    type: "date",
  },
  content: {
    type: "text",
  },
  reactions: {
    type: "string[]",
  },
  poll: {
    type: "string[]",
  },
  mentions: {
    type: "string[]",
  },
});

export const createMessageRepository = (client: Client) =>
  client.fetchRepository(messageSchema);

export const createMessageIndex = () =>
  executeCommand(async (client) =>
    createMessageRepository(client).createIndex()
  );

export const messageCrud = {
  create: async (data: MessageCreate) =>
    executeCommand(async (client) => {
      const repository = createMessageRepository(client);
      const message = repository.createEntity({
        ...data,
        createdAt: rightNow(),
        changedAt: rightNow(),
        reactions: [],
        poll: [],
        mentions: [],
      });

      message.id = message.entityId;

      return repository.save(message);
    }) as Promise<Message>,
  readList: (...ids: string[]) =>
    executeCommand((client) =>
      createMessageRepository(client).fetch(...ids)
    ) as Promise<Message[]>,
  read: (id: string) =>
    messageCrud.readList(id).then((entities) => entities[0]),
  update: (id: string, data: Partial<Message>) =>
    executeCommand(async (client) => {
      const repository = createMessageRepository(client);
      const message = await repository.fetch(id);

      if (!message) {
        throw new messageErrors.MessageNotFoundError();
      }

      message.content = data.content ?? message.content;
      message.reactions = data.reactions ?? message.reactions;
      message.poll = data.poll ?? message.poll;
      message.mentions = data.mentions ?? message.mentions;
      message.changedAt = rightNow();

      return repository.save(message);
    }),
  delete: (id: string) =>
    executeCommand((client) => createMessageRepository(client).remove(id)),
};

export const messageQueries = {
  allMessages: () =>
    executeCommand((client) =>
      createMessageRepository(client).search().return.all()
    ) as Promise<Message[]>,
  totalMessages: () =>
    executeCommand((client) =>
      createMessageRepository(client).search().return.count()
    ) as Promise<number>,
  userMessages: (userId: string) =>
    executeCommand((client) =>
      createMessageRepository(client)
        .search()
        .where("userId")
        .equals(userId)
        .return.all()
    ) as Promise<Message[]>,
};

export const messageMutations = {
  createMessage: async (data: MessageCreate) => {
    const potentialMentions = data.content
      .split(" ")
      .filter((word) => word.startsWith("@"))
      .map((potentialUsername) => potentialUsername.slice(1));
    const mentions =
      potentialMentions.length > 0
        ? await UserEntity.queries.usersByUsernameList(...potentialMentions)
        : [];
    const message = await messageCrud.create({
      ...data,
      mentions: mentions.map(({ id }) => id),
    });

    return messageCrud.create(message);
  },
  editMessage: async (messageId: string, userId: string, content: string) => {
    const message = await messageCrud.read(messageId);

    if (!message) {
      throw new messageErrors.MessageNotFoundError();
    }

    if (userId !== message.userId) {
      throw new messageErrors.MessageForbiddenEditError();
    }

    if (content === message.content) {
      return;
    }

    message.content = content;

    return messageCrud.update(messageId, message);
  },
  deleteMessage: async (messageId: string, userId: string) => {
    const message = await messageCrud.read(messageId);

    if (!message) {
      throw new messageErrors.MessageNotFoundError();
    }

    if (userId !== message.userId) {
      throw new messageErrors.MessageForbiddenDeleteError();
    }

    return messageCrud.delete(messageId);
  },
  reactToMessage: async (
    messageId: string,
    userId: string,
    reaction: string
  ) => {
    const message = await messageCrud.read(messageId);

    if (!message) {
      throw new messageErrors.MessageNotFoundError();
    }

    message.react(userId, reaction);

    return messageCrud.update(messageId, message);
  },
  voteInMessagePoll: async (
    messageId: string,
    userId: string,
    option: string
  ) => {
    const message = await messageCrud.read(messageId);

    if (!message) {
      throw new messageErrors.MessageNotFoundError();
    }

    const voted = message.voteInPoll(userId, option);

    if (voted) {
      return messageCrud.update(messageId, message);
    }
  },
};

export const messageErrors = {
  MessageForbiddenEditError: class extends Error {
    statusCode = 403;
    message = "User does not have permission to edit that message.";
  },
  MessageForbiddenDeleteError: class extends Error {
    statusCode = 403;
    message = "User does not have permission to edit that message.";
  },
  MessageNotFoundError: class extends Error {
    statusCode = 404;
    message = "That message does not exist.";
  },
  MessageContentConflict: class extends Error {
    statusCode = 409;
    message = "That message was recently sent.";
  },
};

// #endregion

export class MessageEntity {
  public static schema = messageSchema;
  public static createIndex = createMessageIndex;
  public static crud = messageCrud;
  public static queries = messageQueries;
  public static mutations = messageMutations;
  public static errors = messageErrors;
}

// #region Helpers
export function serializeMessageReactions(
  options: MessageReaction[]
): string[] {
  return options.map(
    ({ reaction, users }) => `${reaction}___${users.join(",")}`
  );
}

export function deserializeMessageReactions(
  reactionStrings: string[]
): MessageReaction[] {
  return reactionStrings.reduce((prev, next) => {
    const [reaction, usersString] = next.split("___");
    const users = usersString.split(",");

    return prev.concat({ reaction, users });
  }, [] as MessageReaction[]);
}

export function serializeMessagePollOptions(
  options: MessagePollOption[]
): string[] {
  return options.map(({ option, votes }) => `${option}___${votes.join(",")}`);
}

export function deserializeMessagePollOptions(
  optionStrings: string[]
): MessagePollOption[] {
  return optionStrings.reduce((prev, next) => {
    const [option, votesString] = next.split("___");
    const votes = votesString.split(",");

    return prev.concat({ option, votes });
  }, [] as MessagePollOption[]);
}
// #endregion
