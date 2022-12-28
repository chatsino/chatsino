import { executeCommand } from "object-mapper";
import { rightNow } from "helpers";
import { createRoomRepository, Room } from "./room.schema";
import { RoomCreate, RoomNotFoundError } from "./room.types";

export const roomCrud = {
  create: (data: RoomCreate) =>
    executeCommand(async (client) => {
      const repository = createRoomRepository(client);
      const room = repository.createEntity({
        ...data,
        createdAt: rightNow(),
        changedAt: rightNow(),
        permissions: [Room.serializePermissions(data.ownerId, "O")],
        users: [],
        messages: [],
        pins: [],
      });

      room.id = room.entityId;

      await repository.save(room);

      return room;
    }) as Promise<Room>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) => {
      const rooms = await createRoomRepository(client).fetch(...ids);

      return [rooms].flat().filter((room) => room.id);
    }) as Promise<Room[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const room = await createRoomRepository(client).fetch(id);

      if (!room.id) {
        throw new RoomNotFoundError();
      }

      return room;
    }) as Promise<Room>,
  update: (id: string, data: Partial<Room>) =>
    executeCommand(async (client) => {
      const repository = createRoomRepository(client);
      const room = await repository.fetch(id);

      if (!room.id) {
        throw new RoomNotFoundError();
      }

      room.id = data.id ?? room.id;
      room.avatar = data.avatar ?? room.avatar;
      room.title = data.title ?? room.title;
      room.description = data.description ?? room.description;
      room.password = data.password ?? room.password;
      room.permissions = data.permissions ?? room.permissions;
      room.messages = data.messages ?? room.messages;
      room.users = data.users ?? room.users;
      room.pins = data.pins ?? room.pins;
      room.changedAt = rightNow();

      await repository.save(room);

      return roomCrud.read(room.entityId);
    }) as Promise<Room>,
  delete: (id: string) =>
    executeCommand(async (client) => createRoomRepository(client).remove(id)),
};
