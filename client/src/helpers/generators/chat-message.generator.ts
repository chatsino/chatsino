import Chance from "chance";
import { UserGenerator } from "./user.generator";

interface ChatMessageOverride extends Partial<Omit<ChatMessageData, "author">> {
  author?: Partial<ChatUserData>;
}

const CHANCE = new Chance();

export class ChatMessageGenerator {
  public static generateChatMessage(overrides: ChatMessageOverride = {}) {
    const { author: authorOverride = {}, ...topLevelFields } = overrides;
    const author = {
      ...UserGenerator.generateChatUser(),
      ...authorOverride,
    };
    return {
      id: CHANCE.integer({ min: 0, max: 1000000 }),
      clientId: author.id,
      chatroomId: CHANCE.integer({ min: 0, max: 1000000 }),
      author,
      content: CHANCE.paragraph(),
      pinned: CHANCE.bool({ likelihood: 5 }),
      reactions: {},
      poll: null,
      createdAt: new Date().toString(),
      updatedAt: new Date().toString(),
      ...topLevelFields,
    };
  }

  public static generateChatMessageList(count: number) {
    return Array.from({ length: count }, () =>
      ChatMessageGenerator.generateChatMessage()
    );
  }

  public static generateRealisticChatMessageList(
    users: ChatUserData[],
    count: number
  ) {
    count = Math.max(count, 5);

    const chatMessages = ChatMessageGenerator.generateChatMessageList(count);

    let [previousAuthor] = users;

    for (const message of chatMessages) {
      const isNewAuthor = CHANCE.bool({ likelihood: 40 });

      message.author = isNewAuthor ? CHANCE.pickone(users) : previousAuthor;

      if (previousAuthor !== message.author) {
        previousAuthor = message.author;
      }
    }

    return chatMessages;
  }
}
