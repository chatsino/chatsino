import Chance from "chance";
import { ChatMessageGenerator } from "./chat-message.generator";
import { UserGenerator } from "./user.generator";

interface ChatroomOverride extends Partial<Omit<ChatroomData, "createdBy">> {
  createdBy?: Partial<ChatroomData["createdBy"]>;
}

const CHANCE = new Chance();

export class ChatroomGenerator {
  public static generateChatroom(overrides: Partial<ChatroomOverride> = {}) {
    const { createdBy: createdByOverride = {}, ...topLevelFields } = overrides;
    const users = UserGenerator.generateChatUserList(30);
    const messages = ChatMessageGenerator.generateRealisticChatMessageList(
      users,
      80
    );

    return {
      id: CHANCE.integer({ min: 0, max: 1200000 }),
      title: CHANCE.word({ length: 12 }),
      description: CHANCE.paragraph(),
      createdBy: {
        ...UserGenerator.generateChatUser(),
        ...createdByOverride,
      },
      users,
      messages,
      ...topLevelFields,
    };
  }

  public static generateChatroomList(count: number) {
    return Array.from({ length: count }, () =>
      ChatroomGenerator.generateChatroom()
    );
  }
}
