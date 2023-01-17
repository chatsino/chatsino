import { executeCommand } from "cache";
import { HydratedMessage, MessageEntity } from "entities/message";
import { User, UserEntity } from "entities/user";
import { Client, Entity, Schema } from "redis-om";
import { roomErrors } from "./room.errors";
import {
  OnlyPermissionMarker,
  RoomPermission,
  RoomPermissionLookup,
  RoomUserPermissions,
} from "./room.types";

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

export interface HydratedRoom extends Omit<Room, "users" | "messages"> {
  owner: User;
  users: User[];
  messages: HydratedMessage[];
}

export class Room extends Entity {
  public static serializePermissions(userId: string, permissions: string) {
    return [userId, permissions].join("/");
  }

  public static deserializePermissions(permissionsString: string) {
    const [userId, permissions] = permissionsString.split("/");

    return {
      userId,
      permissions,
    };
  }

  public static serializeDirectMessageRoomId(userIdA: string, userIdB: string) {
    const joined = [userIdA, userIdB]
      .sort((a, b) => a.localeCompare(b))
      .join("___");
    return `DM/${joined}`;
  }

  public static deserializeDirectMessageRoomId(roomId: string) {
    const [_, joined] = roomId.split("/");
    const users = joined.split("___");

    return users;
  }

  public get fields() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      createdAt: this.createdAt,
      changedAt: this.changedAt,
      avatar: this.avatar,
      title: this.title,
      description: this.description,
      password: this.password,
      users: this.users,
      permissions: this.permissions,
      messages: this.messages,
      pins: this.pins,
    } as Room;
  }

  public get permissionLookup(): RoomPermissionLookup {
    const whitelistActive = this.permissions.some((permissions) =>
      Room.deserializePermissions(permissions).permissions.includes("W")
    );

    return this.permissions.reduce((prev, next) => {
      const { userId, permissions } = Room.deserializePermissions(next);
      const isOwner = permissions.includes(RoomPermission.Owner);
      const permissionLookup = {
        [RoomPermission.Owner]: isOwner,
        [RoomPermission.CoOwner]:
          isOwner || permissions.includes(RoomPermission.CoOwner),
        [RoomPermission.Muted]: permissions.includes(RoomPermission.Muted),
        [RoomPermission.Blacklisted]: permissions.includes(
          RoomPermission.Blacklisted
        ),
        [RoomPermission.Whitelisted]: permissions.includes(
          RoomPermission.Whitelisted
        ),
      };
      const isAnOwner =
        permissionLookup[RoomPermission.Owner] ||
        permissionLookup[RoomPermission.CoOwner];
      const meetsGuestRequirements =
        isAnOwner ||
        (!permissionLookup[RoomPermission.Blacklisted] &&
          (!whitelistActive ||
            (whitelistActive && permissionLookup[RoomPermission.Whitelisted])));

      prev[userId] = {
        ...permissionLookup,
        [RoomPermission.Guest]: meetsGuestRequirements,
        [RoomPermission.Talk]:
          meetsGuestRequirements && !permissionLookup[RoomPermission.Muted],
      };

      return prev;
    }, {} as Record<string, RoomUserPermissions>);
  }

  public get whitelistActive(): boolean {
    return Object.values(this.permissionLookup).some(
      (permissions) => permissions[RoomPermission.Whitelisted]
    );
  }

  public async hydrate() {
    const { users: _, messages: __, ...rest } = this.fields;
    const [owner, ...users] = await UserEntity.queries.usersByUserIds(
      this.ownerId,
      ...this.users
    );
    const messages = await MessageEntity.queries.messagesByMessageIds(
      ...this.messages
    );

    return {
      ...rest,
      owner,
      users,
      messages,
    } as HydratedRoom;
  }

  public getUserPermissions(userId: string): RoomUserPermissions {
    const whitelistActive = this.permissions.some((permissions) =>
      Room.deserializePermissions(permissions).permissions.includes("W")
    );

    return (
      this.permissionLookup[userId] ?? {
        [RoomPermission.Owner]: false,
        [RoomPermission.CoOwner]: false,
        [RoomPermission.Guest]: !whitelistActive,
        [RoomPermission.Talk]: !whitelistActive,
        [RoomPermission.Muted]: false,
        [RoomPermission.Blacklisted]: false,
        [RoomPermission.Whitelisted]: false,
      }
    );
  }

  public meetsPermissionRequirement<T extends string>(
    userId: string,
    requirement: T & OnlyPermissionMarker<T>
  ): boolean {
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions[requirement as keyof RoomUserPermissions];
  }

  public pinMessage(messageId: string) {
    if (!this.messages.includes(messageId)) {
      throw new roomErrors.MessageNotFoundError();
    }

    const previouslyPinned = this.pins.includes(messageId);

    if (previouslyPinned) {
      this.pins = this.pins.filter((each) => each !== messageId);
    } else {
      this.pins.push(messageId);
    }

    return !previouslyPinned;
  }

  public removeMessage(messageId: string) {
    if (!this.messages.includes(messageId)) {
      throw new roomErrors.MessageNotFoundError();
    }

    this.messages = this.messages.filter((each) => each !== messageId);
  }
}

export const roomSchema = new Schema(Room, {
  id: {
    type: "string",
  },
  ownerId: {
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
  title: {
    type: "text",
  },
  description: {
    type: "text",
  },
  password: {
    type: "string",
  },
  permissions: {
    type: "string[]",
  },
  users: {
    type: "string[]",
  },
  messages: {
    type: "string[]",
  },
  pins: {
    type: "string[]",
  },
});

export const createRoomRepository = (client: Client) =>
  client.fetchRepository(roomSchema);

export const createRoomIndex = () =>
  executeCommand((client) => createRoomRepository(client).createIndex());
