import { Chance } from "chance";
import { RoomCreate, User, UserCreate } from "./types";

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
      rooms: [],
      createdAt: new Date().toString(),
      changedAt: new Date().toString(),
    };
  }

  public static makeUsers(amount: number): User[] {
    return Array.from({ length: amount }, (_, index) =>
      CacheGenerator.makeUser(index + 1)
    );
  }

  public static makeRoomCreate(): RoomCreate {
    return {
      avatar: CHANCE.avatar({ fileExtension: "png" }),
      title: CHANCE.capitalize(
        CHANCE.name({ nationality: "en" }).replace(" ", "").toLowerCase()
      ),
      description: CHANCE.sentence(),
      password: CHANCE.bool({ likelihood: 20 }) ? CHANCE.word() : "",
    };
  }

  public static makeRoom(id: number, ownerId: number) {
    return {
      ...CacheGenerator.makeRoomCreate(),
      id,
      permissions: {
        [ownerId]: ["owner"],
      },
    };
  }

  public static makeRooms(ownerId: number, amount: number) {
    const lobby = {
      id: 1,
      avatar: CHANCE.avatar({ fileExtension: "png" }),
      title: "Lobby",
      description: "An entrance hall sort of place.",
      password: "",
      permissions: {
        [ownerId]: ["owner"],
      },
    };

    return [
      lobby,
      ...Array.from({ length: amount }, (_, index) =>
        CacheGenerator.makeRoom(index + 2, ownerId)
      ),
    ];
  }
}
