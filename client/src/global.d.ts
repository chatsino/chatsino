declare interface ChatMessage {
  id: number;
  author: {
    id: number;
    avatar: string;
    username: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}
