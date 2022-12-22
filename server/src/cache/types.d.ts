import { number, string } from "yup";

export type Metadata = {
  id: number;
  createdAt: string;
  changedAt: string;
};

export type UserCreate = {
  avatar: string;
  username: string;
};

export type User = Metadata &
  UserCreate & {
    chips: number;
    rooms: number[];
  };

export type RoomPermission = "owner" | "blacklisted" | "whitelisted";

export type RoomCreate = {
  avatar: string;
  title: string;
  description: string;
  password: string;
};

export type Room = Metadata & {
  permissions: Record<number, RoomPermission[]>;
};

export type MessageCreate = {
  content: string;
};

export type Message = Metadata &
  MessageCreate & {
    userId: number;
    roomId: number;
  };
