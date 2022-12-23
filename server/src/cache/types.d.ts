import { number, string } from "yup";

export type Metadata<T> = {
  id: T;
  createdAt: string;
  changedAt: string;
};

export type UserID = number;
export type RoomID = number;
export type MessageID = number;

export type UserCreate = {
  avatar: string;
  username: string;
};

export type User = Metadata<UserID> &
  UserCreate & {
    chips: number;
    rooms: RoomID[];
    messages: MessageID[];
  };

export type RoomPermission = "owner" | "blacklisted" | "whitelisted";

export type RoomCreate = {
  ownerId: UserID;
  avatar: string;
  title: string;
  description: string;
  password: string;
};

export type Room = Metadata<RoomID> &
  RoomCreate & {
    permissions: Record<UserID, RoomPermission[]>;
    users: UserID[];
    messages: MessageID[];
  };

export type MessageCreate = {
  authorId: UserID;
  roomId: RoomID;
  content: string;
};

export type Message = Metadata<MessageID> &
  MessageCreate & {
    reactions: Record<string, UserID[]>;
  };
