declare interface ChatsinoMessage {
  id: string;
  // userId: string;
  user: ChatsinoUser;
  // roomId: string;
  room: ChatsinoRoom;
  createdAt: string;
  changedAt: string;
  content: string;
  reactions: string[];
  poll: string[];
  mentions: string[];
}

declare interface ChatsinoRoom {
  id: string;
  // ownerId: string;
  owner: ChatsinoUser;
  createdAt: string;
  changedAt: string;
  avatar: string;
  title: string;
  description: string;
  password: string;
  users: ChatsinoUser[];
  permissions: string[];
  messages: ChatsinoMessage[];
  pins: string[];
}

declare interface ChatsinoRoulette {
  id: string;
  startedAt: string;
  status: RouletteStatus;
  bets: string[];
  results: string[];
  participants: ChatsinoUser[];
  outcome: number;
}

declare interface ChatsinoSniper {
  id: string;
  startedAt: string;
  status: SniperStatus;
  snipes: string[];
  participants: ChatsinoUser[];
  pot: number;
  winner: null | ChatsinoUser;
}

declare interface ChatsinoUser {
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
}
