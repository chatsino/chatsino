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
    pins: MessageID[];
  };

export type MessageCreate = {
  authorId: UserID;
  roomId: RoomID;
  content: string;
};

export type Message = Metadata<MessageID> &
  MessageCreate & {
    reactions: Record<string, UserID[]>;
    pinned?: boolean;
  };

export type Potentially<T> = T | undefined;

export type EntityRetrievalRequest = {
  userId?: Potentially<UserID>;
  roomId?: Potentially<RoomID>;
  messageId?: Potentially<MessageID>;
};

export type EntityRetrievalResult<
  U extends Potentially<UserID>,
  R extends Potentially<RoomID>,
  M extends Potentially<MessageID>
> = {
  user: U extends UserID ? User : null;
  room: R extends RoomID ? Room : null;
  message: M extends MessageID ? Message : null;
};
