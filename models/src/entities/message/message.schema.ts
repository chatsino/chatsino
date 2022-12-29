import { executeCommand } from "cache";
import { Client, Entity, Schema } from "redis-om";
import { UserEntity } from "../user";
import { MessagePollOption, MessageReaction } from "./message.types";

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

export class Message extends Entity {
  public static async determineMentions(content: string) {
    const potentialMentions = content
      .split(" ")
      .filter((word) => word.startsWith("@"))
      .map((potentialUsername) => potentialUsername.slice(1));
    const mentionedUsers =
      potentialMentions.length > 0
        ? await UserEntity.queries.usersByUsernameList(...potentialMentions)
        : [];

    return mentionedUsers.map((each) => each.id);
  }

  public static serializeReactions(options: MessageReaction[]) {
    return options.map(
      ({ reaction, users }) => `${reaction}___${users.join(",")}`
    );
  }

  public static deserializeReactions(
    reactionStrings: string[]
  ): MessageReaction[] {
    return reactionStrings.reduce((prev, next) => {
      const [reaction, usersString] = next.split("___");
      const users = usersString.split(",");

      return prev.concat({ reaction, users });
    }, [] as MessageReaction[]);
  }

  public static serializePollOptions(options: MessagePollOption[]): string[] {
    return options.map(({ option, votes }) => `${option}___${votes.join(",")}`);
  }

  public static deserializePollOptions(
    optionStrings: string[]
  ): MessagePollOption[] {
    return optionStrings.reduce((prev, next) => {
      const [option, votesString] = next.split("___");
      const votes = votesString.split(",");

      return prev.concat({ option, votes });
    }, [] as MessagePollOption[]);
  }

  public get fields() {
    return {
      id: this.id,
      userId: this.userId,
      roomId: this.roomId,
      createdAt: this.createdAt,
      changedAt: this.changedAt,
      content: this.content,
      reactions: this.reactions,
      poll: this.poll,
      mentions: this.mentions,
    };
  }

  public get isPoll() {
    return this.poll.length > 0;
  }

  public getFormattedAuthor() {
    return UserEntity.crud.read(this.userId);
  }

  public getHydratedReactions() {
    const deserialized = Message.deserializeReactions(this.reactions);

    return Promise.all(
      deserialized.map(async ({ reaction, users }) => ({
        reaction,
        users: await UserEntity.crud.readList(...users),
      }))
    );
  }

  public getFormattedPoll() {
    const deserialized = Message.deserializePollOptions(this.poll);

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

    this.poll = Message.serializePollOptions(poll.options);

    return true;
  }

  public react(userId: string, reaction: string) {
    const reactionLookup = Message.deserializeReactions(this.reactions).reduce(
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

    this.reactions = Message.serializeReactions(
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
