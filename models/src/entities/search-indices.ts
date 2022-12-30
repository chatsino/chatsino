import { MessageEntity } from "./message";
import { RoomEntity } from "./room";
import { RouletteEntity } from "./roulette";
import { SniperEntity } from "./sniper";
import { UserEntity } from "./user";

export async function buildSearchIndices() {
  return Promise.all(
    [MessageEntity, RoomEntity, RouletteEntity, SniperEntity, UserEntity].map(
      (entity) => entity.createIndex()
    )
  );
}
