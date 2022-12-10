import { ChatMessageGenerator } from "helpers";
import { groupMessages } from "./group-messages";

describe("groupMessages()", () => {
  it("should group a series of chat messages into collections by author", () => {
    const sampleMessageA = ChatMessageGenerator.generateChatMessage();
    const sampleMessageB = ChatMessageGenerator.generateChatMessage();
    const chatMessages = [
      sampleMessageA,
      sampleMessageA,
      sampleMessageB,
      sampleMessageB,
      sampleMessageB,
    ];
    const chatGroups = [
      {
        author: sampleMessageA.author,
        messages: [sampleMessageA, sampleMessageA],
      },
      {
        author: sampleMessageB.author,
        messages: [sampleMessageB, sampleMessageB, sampleMessageB],
      },
    ];

    expect(groupMessages(chatMessages)).toEqual(chatGroups);
  });
});
