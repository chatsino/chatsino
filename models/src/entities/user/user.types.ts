export type UserRole = "user" | "moderator" | "administrator" | "operator";

export type UserCreate = {
  avatar: string;
  username: string;
  password: string;
};
