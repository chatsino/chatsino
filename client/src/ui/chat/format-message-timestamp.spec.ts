import { ChatMessageGenerator } from "helpers";
import { formatMessageTimestamp } from "./format-message-timestamp";

describe("formatMessageTimestamp()", () => {
  describe("when message has not been edited", () => {
    it("should format a timestamp from today", () => {
      const message = ChatMessageGenerator.generateChatMessage();
      const formatted = formatMessageTimestamp(message);

      expect(formatted).toBe(
        `Today at ${new Intl.DateTimeFormat("en-us", {
          timeStyle: "short",
        }).format(new Date())}`
      );
    });
    it("should format a timestamp from yesterday", () => {
      const yesterdayDate = new Date(
        new Date().getTime() - 1000 * 60 * 60 * 24
      );
      const message = ChatMessageGenerator.generateChatMessage({
        createdAt: yesterdayDate.toString(),
        updatedAt: yesterdayDate.toString(),
      });
      const formatted = formatMessageTimestamp(message);

      expect(formatted).toBe(
        `Yesterday at ${new Intl.DateTimeFormat("en-us", {
          timeStyle: "short",
        }).format(yesterdayDate)}`
      );
    });
    it("should format a timestamp from before yesterday", () => {
      const beforeYesterdayDate = new Date(1600000000000);
      const message = ChatMessageGenerator.generateChatMessage({
        createdAt: beforeYesterdayDate.toString(),
        updatedAt: beforeYesterdayDate.toString(),
      });
      const formatted = formatMessageTimestamp(message);

      expect(formatted).toBe(
        `9/13/2020 at ${new Intl.DateTimeFormat("en-us", {
          timeStyle: "short",
        }).format(beforeYesterdayDate)}`
      );
    });
  });
  describe("when message has been edited", () => {
    it("should format a timestamp that has been updated today", () => {
      const previousDate = new Date(new Date().getTime() - 1000 * 60 * 10);
      const message = ChatMessageGenerator.generateChatMessage({
        createdAt: previousDate.toString(),
      });
      const formatted = formatMessageTimestamp(message);

      expect(formatted.includes("Updated today at")).toBe(true);
    });
    it("should format a timestamp that was updated yesterday", () => {
      const previousDate = new Date(
        new Date().getTime() - 1000 * 60 * 60 * 24 * 2
      );
      const yesterdayDate = new Date(
        new Date().getTime() - 1000 * 60 * 60 * 24
      );
      const message = ChatMessageGenerator.generateChatMessage({
        createdAt: previousDate.toString(),
        updatedAt: yesterdayDate.toString(),
      });
      const formatted = formatMessageTimestamp(message);

      expect(formatted.includes("Updated yesterday at")).toBe(true);
    });
    it("should format a timestamp that was updated before yesterday", () => {
      const previousDate = new Date(1600000000000 - 1000 * 60 * 5);
      const beforeYesterdayDate = new Date(1600000000000);
      const message = ChatMessageGenerator.generateChatMessage({
        createdAt: previousDate.toString(),
        updatedAt: beforeYesterdayDate.toString(),
      });
      const formatted = formatMessageTimestamp(message);

      expect(formatted.includes("Updated 9/13/2020 at")).toBe(true);
    });
  });
});
