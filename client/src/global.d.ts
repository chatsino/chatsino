declare interface ChatUserData {
  id: number;
  avatar: string;
  username: string;
}

declare interface ChatMessageData {
  id: number;
  author: ChatUserData;
  content: string;
  createdAt: string;
  updatedAt: string;
}

declare interface ChatroomData {
  id: number;
  title: string;
  description: string;
  createdBy: null | ChatUserData;
}
