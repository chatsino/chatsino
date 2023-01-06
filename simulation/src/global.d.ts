declare interface User {
  id: string;
  createdAt: string;
  changedAt: string;
  avatar: string;
  username: string;
  chips: number;
  sessionCount: number;
  lastActive: string;
  role: UserRole;
  banDuration: number;
  hash: string;
  salt: string;
}

declare interface Room {
  id: string;
  ownerId: string;
  createdAt: string;
  changedAt: string;
  avatar: string;
  title: string;
  description: string;
  password: string;
  users: string[];
  permissions: string[];
  messages: string[];
  pins: string[];
}

declare interface Message {
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
