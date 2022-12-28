import { roomCrud } from "./room.crud";
import { roomMutations } from "./room.mutations";
import { roomQueries } from "./room.queries";
import { createRoomIndex, roomSchema } from "./room.schema";

export * from "./room.schema";
export * from "./room.types";

export class RoomEntity {
  public static createIndex = createRoomIndex;
  public static crud = roomCrud;
  public static schema = roomSchema;
  public static queries = roomQueries;
  public static mutations = roomMutations;
}
