import { makeHttpRequest } from "helpers";

export interface RoomListLoaderData {
  rooms: ChatsinoRoom[];
}

export async function roomListLoader(): Promise<RoomListLoaderData> {
  const { rooms } = (await makeHttpRequest("get", "/chat/rooms")) as {
    rooms: ChatsinoRoom[];
  };

  return {
    rooms,
  };
}
