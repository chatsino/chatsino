import type { Room } from "models/room";
import type { User } from "models/user";

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

export interface HydratedMessage extends Message {
  user: User;
  room: Room;
}

export enum MessageSocketRequests {
  // Queries
  GetMessage = "get-message",
  GetTotalMessages = "get-total-messages",
  GetUserMessages = "get-user-messages",
  GetMessagesByMessageIds = "get-messages-by-message-ids",

  // Mutations
  CreateMessage = "create-message",
  EditMessage = "edit-message",
  DeleteMessage = "delete-message",
  ReactToMessage = "react-to-message",
  VoteInMessagePoll = "vote-in-message-poll",
}

export enum MessageSocketEvents {
  MessageCreated = "message-created",
  MessageChanged = "message-changed",
  MessageDeleted = "message-deleted",
}
