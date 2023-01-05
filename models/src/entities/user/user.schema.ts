import { executeCommand } from "cache";
import { generatePasswordHash, generatePasswordSaltHash } from "helpers";
import { Client, Entity, Schema } from "redis-om";
import { USER_ROLE_RANKING } from "./user.config";
import { UserRole } from "./user.types";

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
      role: this.role,
      banDuration: this.banDuration,
      // hash & salt are not "public"
    };
  }

  public get permissions() {
    return USER_ROLE_RANKING.reduce((prev, next) => {
      return {
        ...prev,
        [next]: this.meetsPermissionRequirement(next),
      };
    }, {} as Record<UserRole, boolean>);
  }

  public get isOperator() {
    return this.permissions.operator;
  }

  public get isAdministrator() {
    return this.permissions.administrator;
  }

  public get isModerator() {
    return this.permissions.moderator;
  }

  public get isPermanentlyBanned() {
    return this.banDuration === -1;
  }

  public get isTemporarilyBanned() {
    return this.banDuration > 0;
  }

  public get isBanned() {
    return this.isTemporarilyBanned || this.isPermanentlyBanned;
  }

  public reassign(role: UserRole) {
    this.role = role;
  }

  public ban(duration: number) {
    this.banDuration = duration;
  }

  public unban() {
    this.banDuration = 0;
  }

  public charge(amount: number) {
    this.chips = Math.max(0, this.chips - amount);
  }

  public pay(amount: number) {
    this.chips += amount;
  }

  public async changePassword(password: string) {
    const { hash, salt } = await generatePasswordSaltHash(password);

    this.hash = hash;
    this.salt = salt;
  }

  public async checkPassword(attempt: string) {
    return (await generatePasswordHash(attempt, this.salt)) === this.hash;
  }

  private meetsPermissionRequirement(requirement: UserRole) {
    const permissionIndex = USER_ROLE_RANKING.indexOf(requirement);
    const permissions = USER_ROLE_RANKING.slice(0, permissionIndex + 1);

    return permissions.includes(requirement);
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
    type: "text",
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
  role: {
    type: "string",
  },
  banDuration: {
    type: "number",
  },
  hash: {
    type: "string",
    sortable: false,
  },
  salt: {
    type: "string",
    sortable: false,
  },
});

export const createUserRepository = (client: Client) =>
  client.fetchRepository(userSchema);

export const createUserIndex = () =>
  executeCommand((client) => createUserRepository(client).createIndex());
