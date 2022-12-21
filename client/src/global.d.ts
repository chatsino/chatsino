declare interface ChatUserData {
  id: number;
  avatar: string;
  username: string;
}

declare interface ChatMessagePollAnswer {
  text: string;
  respondents: number[];
}

declare interface ChatMessagePollData {
  question: string;
  answers: ChatMessagePollAnswer[];
}

declare interface ChatMessageData {
  id: number;
  clientId: number;
  chatroomId: number;
  content: string;
  pinned: boolean;
  reactions: Record<string, number[]>;
  poll: null | ChatMessagePollData;
  createdAt: string;
  updatedAt: string;
  author: ChatUserData;
}

declare interface ChatroomData {
  id: number;
  avatar: string;
  title: string;
  description: string;
  createdBy: ChatUserData;
  updatedBy: ChatUserData;
  createdAt: string;
  updatedAt: string;
  public: boolean;
  users: ChatUserData[];
}
