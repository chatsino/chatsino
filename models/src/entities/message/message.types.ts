export type MessageCreate = {
  roomId: string;
  userId: string;
  content: string;
  mentions?: string[];
};

export type MessageReaction = {
  reaction: string;
  users: string[];
};

export type MessagePollOption = {
  option: string;
  votes: string[];
};
