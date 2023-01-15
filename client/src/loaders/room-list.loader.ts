import { makeHttpRequest } from "helpers";

export interface RoomListLoaderData {
  rooms: ChatroomData[];
}

export async function roomListLoader(): Promise<RoomListLoaderData> {
  const { rooms } = (await makeHttpRequest("get", "/chat/rooms")) as {
    rooms: ChatroomData[];
  };

  return {
    rooms,
  };
}
