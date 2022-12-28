import { executeCommand } from "cache/object-mapper";
import { MessageEntity } from "../message";
import { UserEntity } from "../user";
import { roomCrud } from "./room.crud";
import { createRoomRepository, Room } from "./room.schema";
import { OnlyPermissionMarker } from "./room.types";

export const roomQueries = {
  allRooms: () =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("title")
        .does.not.match("DM*")
        .return.all()
    ) as Promise<Room[]>,
  allPublicRooms: async () => {
    const rooms = await roomQueries.allRooms();

    return rooms.filter(
      (room) =>
        room.id === room.entityId && !(room.password || room.whitelistActive)
    );
  },
  totalRooms: () =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("title")
        .does.not.match("DM*")
        .return.count()
    ) as Promise<number>,
  roomById: (roomId: string) =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("id")
        .equals(roomId)
        .return.first()
    ) as Promise<null | Room>,
  roomByRoomTitle: (title: string) =>
    executeCommand((client) =>
      createRoomRepository(client)
        .search()
        .where("title")
        .match(title)
        .return.first()
    ) as Promise<null | Room>,
  userPermissions: async (roomId: string, userId: string) => {
    const room = await roomCrud.read(roomId);

    return room.getUserPermissions(userId);
  },
  meetsRoomPermissionRequirement: async <T extends string>(
    roomId: string,
    userId: string,
    requirement: T & OnlyPermissionMarker<T>
  ) => {
    const room = await roomCrud.read(roomId);

    return room.meetsPermissionRequirement(userId, requirement);
  },
  roomUsers: async (roomId: string) => {
    const room = await roomCrud.read(roomId);

    return UserEntity.crud.readList(...room.users);
  },
  roomMessages: async (roomId: string) => {
    const room = await roomCrud.read(roomId);

    return MessageEntity.crud.readList(...room.messages);
  },
};
