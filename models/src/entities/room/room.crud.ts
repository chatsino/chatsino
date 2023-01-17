import { rightNow } from "helpers";
import { executeCommand } from "cache";
import { roomErrors } from "./room.errors";
import { createRoomRepository, HydratedRoom, Room } from "./room.schema";
import { RoomCreate } from "./room.types";

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
    executeCommand(async (client) =>
      [await createRoomRepository(client).fetch(...ids)]
        .flat()
        .filter((room) => room.id)
    ) as Promise<Room[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const room = await createRoomRepository(client).fetch(id);

      if (!room.id) {
        throw new roomErrors.NotFoundError();
      }

      return room;
    }) as Promise<Room>,
  update: (id: string, data: Partial<Room>) =>
    executeCommand(async (client) => {
      const room = await roomCrud.read(id);

      Object.assign(room, {
        ...data,
        changedAt: rightNow(),
      });

      await createRoomRepository(client).save(room);

      return room.hydrate();
    }) as Promise<HydratedRoom>,
  delete: (id: string) =>
    executeCommand(async (client) => createRoomRepository(client).remove(id)),
};
