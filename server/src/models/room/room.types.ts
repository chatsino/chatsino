export enum RoomPermission {
  Owner = "O",
  CoOwner = "C",
  Guest = "G",
  Talk = "T",
  Muted = "M",
  Blacklisted = "B",
  Whitelisted = "W",
}

export interface Room {
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
