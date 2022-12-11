import Chance from "chance";
import sampleAvatarA from "assets/avatars/sampleA.png";
import sampleAvatarB from "assets/avatars/sampleB.png";
import sampleAvatarC from "assets/avatars/sampleC.png";

const CHANCE = new Chance();

export class UserGenerator {
  public static generateChatUser(
    overrides: Partial<ChatMessageData["author"]> = {}
  ) {
    return {
      id: CHANCE.integer({ min: 0, max: 1000000 }),
      avatar: CHANCE.pickone([sampleAvatarA, sampleAvatarB, sampleAvatarC]),
      username: CHANCE.capitalize(CHANCE.word({ length: 12 })),
      ...overrides,
    };
  }

  public static generateChatUserList(count: number) {
    return Array.from({ length: count }, () =>
      UserGenerator.generateChatUser()
    );
  }
}
