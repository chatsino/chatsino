import { executeCommand } from "object-mapper";
import { Client, Entity, Schema } from "redis-om";

export interface User {
  id: string;
  createdAt: string;
  changedAt: string;
  avatar: string;
  username: string;
  chips: number;
  sessionCount: number;
  lastActive: string;
}

export class User extends Entity {
  public get fields() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      changedAt: this.changedAt,
      avatar: this.avatar,
      username: this.username,
      chips: this.chips,
      sessionCount: this.sessionCount,
      lastActive: this.lastActive,
    };
  }
}

export const userSchema = new Schema(User, {
  id: {
    type: "string",
  },
  createdAt: {
    type: "date",
  },
  changedAt: {
    type: "date",
  },
  avatar: {
    type: "string",
  },
  username: {
    type: "string",
  },
  chips: {
    type: "number",
  },
  sessionCount: {
    type: "number",
  },
  lastActive: {
    type: "date",
  },
});

export const createUserRepository = (client: Client) =>
  client.fetchRepository(userSchema);

export const createUserIndex = () =>
  executeCommand((client) => createUserRepository(client).createIndex());
