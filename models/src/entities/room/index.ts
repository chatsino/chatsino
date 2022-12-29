import { roomCrud } from "./room.crud";
import { roomErrors } from "./room.errors";
import { roomMutations } from "./room.mutations";
import { roomQueries } from "./room.queries";
import { createRoomIndex, roomSchema } from "./room.schema";

export * from "./room.crud";
export * from "./room.errors";
export * from "./room.mutations";
export * from "./room.queries";
export * from "./room.schema";
export * from "./room.types";

export class RoomEntity {
  public static createIndex = createRoomIndex;
  public static crud = roomCrud;
  public static errors = roomErrors;
  public static schema = roomSchema;
  public static queries = roomQueries;
  public static mutations = roomMutations;
}
