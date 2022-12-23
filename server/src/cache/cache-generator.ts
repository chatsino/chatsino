import { Chance } from "chance";
import { rightNow } from "helpers";
import {
  Message,
  MessageCreate,
  Room,
  RoomCreate,
  User,
  UserCreate,
} from "./types";

const CHANCE = new Chance();

export class CacheGenerator {
  public static makeUserCreate(): UserCreate {
    return {
      avatar: CHANCE.avatar({ fileExtension: "png" }),
      username: CHANCE.name({ nationality: "en" })
        .replace(" ", "")
        .toLowerCase(),
    };
  }

  public static makeUser(id: number): User {
    return {
      ...CacheGenerator.makeUserCreate(),
      id,
      chips: CHANCE.integer({ min: 0, max: 9999 }),
      createdAt: rightNow(),
      changedAt: rightNow(),
      rooms: [],
      messages: [],
      lastActive: rightNow(),
    };
  }

  public static makeUsers(amount: number): User[] {
    return Array.from({ length: amount }, (_, index) =>
      CacheGenerator.makeUser(index + 1)
    );
  }

  public static makeRoomCreate(
    ownerId: number,
    withPassword = false
  ): RoomCreate {
    return {
      ownerId,
      avatar: CHANCE.avatar({ fileExtension: "png" }),
      title: CHANCE.capitalize(
        CHANCE.name({ nationality: "en" }).replace(" ", "").toLowerCase()
      ),
      description: CHANCE.sentence(),
      password: withPassword ? CHANCE.word() : "",
    };
  }

  public static makeRoom(id: number, ownerId: number): Room {
    return {
      ...CacheGenerator.makeRoomCreate(ownerId),
      id,
      createdAt: rightNow(),
      changedAt: rightNow(),
      permissions: {
        [ownerId]: ["owner"],
      },
      users: [],
      messages: [],
      pins: [],
    };
  }

  public static makeRooms(ownerId: number, amount: number): Room[] {
    const lobby = CacheGenerator.makeRoom(1, 0);
    lobby.title = "Lobby";
    lobby.description = "An entrance hall sort of place.";

    return [
      lobby,
      ...Array.from({ length: amount }, (_, index) =>
        CacheGenerator.makeRoom(index + 2, ownerId)
      ),
    ];
  }

  public static makeMessageCreate(
    authorId: number,
    roomId: number
  ): MessageCreate {
    return {
      authorId,
      roomId,
      content: CHANCE.sentence(),
    };
  }

  public static makeMessage(
    id: number,
    authorId: number,
    roomId: number
  ): Message {
    return {
      ...this.makeMessageCreate(authorId, roomId),
      id,
      reactions: {},
      createdAt: rightNow(),
      changedAt: rightNow(),
    };
  }
}
