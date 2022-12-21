import * as config from "config";
import { ChatroomSocketRequests } from "enums";
import {
  parseSourcedSocketMessage,
  PreparsedSourcedSocketMessage,
} from "helpers";
import { createLogger } from "logger";
import { Chatroom, getClientById, readChatroomList } from "models";
import { SUBSCRIBER } from "persistence";
import { chatroomUpdatedSchema, SourcedSocketMessage } from "schemas";
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
}

// #region Chatrooms
export async function handleListChatrooms(messageString: string) {
  const { kind, from } = JSON.parse(messageString) as SourcedSocketMessage;

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
      `Failed to alert clients to an updated chatroom.`
    );
  }
}
// #endregion

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
