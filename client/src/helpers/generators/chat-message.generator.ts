import Chance from "chance";
import sampleAvatar from "assets/avatars/sample.jpeg";

interface ChatMessageOverride extends Partial<Omit<ChatMessage, "author">> {
  author?: Partial<ChatMessage["author"]>;
}

const CHANCE = new Chance();

export class ChatMessageGenerator {
  public static generateChatMessage(overrides: ChatMessageOverride = {}) {
    const { author: authorOverride = {}, ...topLevelFields } = overrides;

    return {
      id: CHANCE.integer({ min: 0, max: 1000000 }),
      author: {
        id: CHANCE.integer({ min: 0, max: 1000000 }),
        avatar: sampleAvatar,
        username: CHANCE.capitalize(CHANCE.word({ length: 12 })),
        ...authorOverride,
      },
      content: CHANCE.paragraph(),
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
}
