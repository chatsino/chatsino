export type UserRole = "user" | "moderator" | "administrator" | "operator";

export interface User {
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
