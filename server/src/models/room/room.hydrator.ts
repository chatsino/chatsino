import * as config from "config";
import {
  HydratedMessage,
  hydrateMessage,
  Message,
  MessageSocketRequests,
} from "models/message";
import { makeRequest } from "models/requests";
import { User, UserSocketRequests } from "models/user";
import { HydratedRoom, Room } from "./room.types";

export async function hydrateRoom(room: Room): Promise<HydratedRoom> {
  const { ownerId, users: userIds, messages: messageIds } = room;
  const { user: owner } = (await makeRequest(
    config.HYDRATOR_REQUEST_NAME,
    UserSocketRequests.GetUser,
    {
      userId: ownerId,
    }
  )) as {
    user: User;
  };
  const { users } = (await makeRequest(
    config.HYDRATOR_REQUEST_NAME,
    UserSocketRequests.GetUsersByUserIds,
    {
      userIds,
    }
  )) as {
    users: User[];
  };
  const { messages } = (await makeRequest(
    config.HYDRATOR_REQUEST_NAME,
    MessageSocketRequests.GetMessagesByMessageIds,
    {
      messageIds,
    }
  )) as {
    messages: Message[];
  };

  return {
    ...room,
    owner,
    users,
    messages: await Promise.all(messages.map(hydrateMessage)),
  };
}
