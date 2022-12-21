import * as config from "config";
import { ChatroomSocketRequests } from "enums";
import {
  parseSourcedSocketMessage,
  PreparsedSourcedSocketMessage,
} from "helpers";
import { createLogger } from "logger";
import {
  Chatroom,
  getClientById,
  readChatroomList,
  readHydratedChatroom,
} from "models";
import { CHATROOM_CACHE, CLIENT_CACHE, SUBSCRIBER } from "persistence";
import {
  chatroomUpdatedSchema,
  clientEnteredChatroomSchema,
  clientExitedChatroomSchema,
} from "schemas";
import { SocketServer } from "socket-server";
import { CHATROOM_SUBSCRIPTIONS } from "subscriptions";

export const CHATROOM_MANAGER_LOGGER = createLogger(
  config.LOGGER_NAMES.CHATROOM_MANAGER
);

export function initializeChatroomManager() {
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ListChatrooms,
    handleListChatrooms
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ChatroomUpdated,
    handleChatroomUpdated
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ClientEnteredChatroom,
    handleClientEnteredChatroom
  );
  SUBSCRIBER.subscribe(
    ChatroomSocketRequests.ClientExitedChatroom,
    handleClientExitedChatroom
  );
}

export async function handleListChatrooms(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const chatrooms = (await readChatroomList()) as unknown as Chatroom[];
    const chatroomsWithData = await Promise.all(
      chatrooms?.map(async (chatroom) => {
        return {
          ...chatroom,
          createdBy: await getClientById(chatroom.createdBy),
          updatedBy: await getClientById(chatroom.updatedBy),
          users: [],
          messages: [],
        };
      })
    );

    return SocketServer.success(from.id, kind, {
      chatrooms: chatroomsWithData,
    });
  } catch (error) {
    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to list chatrooms."
    );
  }
}

export async function handleChatroomUpdated(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const { chatroom } = await chatroomUpdatedSchema.validate(args);

    await SocketServer.broadcastToSubscription(
      CHATROOM_SUBSCRIPTIONS.chatroomUpdated(chatroom.id),
      {
        chatroom,
      }
    );

    return SocketServer.success(from.id, kind, {
      message: `Alerted clients in Chatroom#${chatroom.id} that the chatroom was updated.`,
    });
  } catch (error) {
    CHATROOM_MANAGER_LOGGER.error(
      { error },
      "Failed to handle updated chatroom."
    );

    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to alert clients to an updated chatroom."
    );
  }
}

export async function handleClientEnteredChatroom(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const { chatroomId } = await clientEnteredChatroomSchema.validate(args);

    await CHATROOM_CACHE.CHATROOM_USERS.addClient(chatroomId, from.id);
    await CLIENT_CACHE.CLIENT_CURRENT_CHATROOM.cache(from.id, chatroomId);

    const chatroomData = await readHydratedChatroom(chatroomId);

    if (chatroomData) {
      await handleChatroomUpdated({
        from,
        kind: ChatroomSocketRequests.ChatroomUpdated,
        args: {
          chatroom: chatroomData.chatroom,
        },
      });
    }

    return SocketServer.success(
      from.id,
      ChatroomSocketRequests.ClientEnteredChatroom
    );
  } catch (error) {
    CHATROOM_MANAGER_LOGGER.error(
      { error },
      "Failed to handle client entering chatroom."
    );

    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to handle client entering chatroom."
    );
  }
}

export async function handleClientExitedChatroom(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    // TODO: When should this actually be cleared?
    const { chatroomId } = await clientExitedChatroomSchema.validate(args);

    await CHATROOM_CACHE.CHATROOM_USERS.removeClient(chatroomId, from.id);
    await CLIENT_CACHE.CLIENT_CURRENT_CHATROOM.clear(from.id);

    const chatroomData = await readHydratedChatroom(chatroomId);

    if (chatroomData) {
      await handleChatroomUpdated({
        from,
        kind: ChatroomSocketRequests.ChatroomUpdated,
        args: {
          chatroom: chatroomData.chatroom,
        },
      });
    }

    return SocketServer.success(
      from.id,
      ChatroomSocketRequests.ClientExitedChatroom
    );
  } catch (error) {
    CHATROOM_MANAGER_LOGGER.error(
      { error },
      "Failed to handle client exiting chatroom."
    );

    return handleChatroomErrors(
      from.id,
      kind,
      error,
      "Failed to handle client exiting chatroom."
    );
  }
}

export function handleChatroomErrors(
  to: number,
  kind: string,
  error: unknown,
  fallback: string
) {
  const sendError = (message: string) => SocketServer.error(to, kind, message);

  if (error instanceof Error) {
    return sendError(fallback);
  }
}
