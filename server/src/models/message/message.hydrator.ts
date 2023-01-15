import * as config from "config";
import { makeRequest } from "models/requests";
import { Room, RoomSocketRequests } from "models/room";
import { User, UserSocketRequests } from "models/user";
import { HydratedMessage, Message } from "./message.types";

export async function hydrateMessage(
  message: Message
): Promise<HydratedMessage> {
  const { userId, roomId } = message;
  const { user } = (await makeRequest(
    config.HYDRATOR_REQUEST_NAME,
    UserSocketRequests.GetUser,
    {
      userId,
    }
  )) as {
    user: User;
  };
  const { room } = (await makeRequest(
    config.HYDRATOR_REQUEST_NAME,
    RoomSocketRequests.Room,
    {
      roomId,
    }
  )) as {
    room: Room;
  };

  return {
    ...message,
    user,
    room,
  };
}
