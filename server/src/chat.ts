import * as config from "config";
import { createLogger, guid, sleep } from "helpers";
import {
  CombinedSubscriptions,
  hydrateMessage,
  hydrateRoom,
  Message,
  MessageSocketEvents,
  MessageSocketRequests,
  Room,
  RoomSocketEvents,
  RoomSocketRequests,
  User,
  UserSocketEvents,
  UserSocketRequests,
} from "models";
import { WebSocket } from "ws";

export type ChatHandlers = Record<
  string, // CombinedSubscriptions
  Maybe<(data: Record<string, unknown>) => unknown>
>;

export const CHAT_LOGGER = createLogger(config.LOGGER_NAMES.CHAT);

export const ROLLOFF_INDICES: Record<string, number> = {};

export async function initializeChat(userId: string, handlers: ChatHandlers) {
  const chatId = guid();
  const modelSocket = new WebSocket(config.MODELS_CONNECTION_STRING);

  let hasBeenManuallyClosed = false;

  await new Promise<void>((resolve) => {
    modelSocket.on("open", () => {
      CHAT_LOGGER.info("Socket connection to Chatsino-Models established.");

      ROLLOFF_INDICES[chatId] = 0;

      resolve();
    });
    modelSocket.on("close", async () => {
      CHAT_LOGGER.info("Socket connection to Chatsino-Models terminated.");

      if (!hasBeenManuallyClosed) {
        const duration =
          config.MODELS_RECONNECT_ATTEMPT_RATES_MS[ROLLOFF_INDICES[chatId]++] ??
          config.MODELS_RECONNECT_ATTEMPT_RATES_MS[
            config.MODELS_RECONNECT_ATTEMPT_RATES_MS.length - 1
          ];

        await sleep(duration);

        CHAT_LOGGER.info(
          { attempt: ROLLOFF_INDICES[chatId] },
          "Attempting to reconnect to Chatsino-Models."
        );

        return initializeChat(userId, handlers);
      }
    });
    modelSocket.on("error", (error) => {
      CHAT_LOGGER.error(
        { error: error.message },
        "Socket connection to Chatsino-Models experienced an error."
      );
    });
    modelSocket.on("message", async (event) => {
      try {
        const { kind, result, data } = JSON.parse(event.toString()) as {
          kind: CombinedSubscriptions;
          // For Requests:
          result?: {
            error: boolean;
            message: string;
            data: Record<string, unknown>;
          };
          // For Events:
          data?: Record<string, unknown>;
        };

        if (data) {
          // Handle events
          CHAT_LOGGER.info(
            { kind },
            "Received a published event from Chatsino-Models."
          );

          switch (kind) {
            case UserSocketEvents.UserCreated:
            case UserSocketEvents.UserChanged: {
              const user = data.user as User;

              return handlers[kind]?.({ user });
            }
            case RoomSocketEvents.RoomCreated:
            case RoomSocketEvents.RoomChanged: {
              const room = data.room as Room;

              return handlers[kind]?.({ room: await hydrateRoom(room) });
            }
            case MessageSocketEvents.MessageCreated:
            case MessageSocketEvents.MessageChanged:
            case MessageSocketEvents.MessageDeleted: {
              const message = data.message as Message;

              return handlers[kind]?.({
                message: await hydrateMessage(message),
              });
            }
            default:
              return;
          }
        } else if (result) {
          // Handle requests
          const { error, message, data: requestData } = result;

          CHAT_LOGGER.info(
            { error, message, kind },
            "Received a response from Chatsino-Models."
          );

          switch (kind) {
            // Users
            case UserSocketRequests.GetUser: {
              return handlers[kind]?.({ user: requestData.user as User });
            }
            case UserSocketRequests.GetAllUsers:
            case UserSocketRequests.GetUsersByUserIds:
            case UserSocketRequests.GetAllOperators:
            case UserSocketRequests.GetAllAdministrators:
            case UserSocketRequests.GetAllModerators:
            case UserSocketRequests.GetBannedUsers:
            case UserSocketRequests.GetUsersWithUsername: {
              return handlers[kind]?.({ users: requestData.users as User[] });
            }
            // Rooms
            // -- Hydrated
            case RoomSocketRequests.Room: {
              const room = requestData.room as Room;

              return handlers[kind]?.({ room: await hydrateRoom(room) });
            }

            // -- Not Hydrated
            case RoomSocketRequests.CreateRoom: {
              return handlers[kind]?.({ room: requestData.room as Room });
            }
            case RoomSocketRequests.AllPublicRooms: {
              return handlers[kind]?.({ rooms: requestData.rooms as Room[] });
            }

            // Messages
            // -- Hydrated
            case MessageSocketRequests.GetMessage: {
              const message = requestData.message as Message;

              return handlers[kind]?.({
                message: await hydrateMessage(message),
              });
            }
            case MessageSocketRequests.GetMessagesByMessageIds: {
              const messages = requestData.messages as Message[];

              return handlers[kind]?.({
                messages: await Promise.all(messages.map(hydrateMessage)),
              });
            }

            // -- Not Hydrated
            case MessageSocketRequests.CreateMessage:
            case MessageSocketRequests.DeleteMessage:
            case MessageSocketRequests.EditMessage:
            case MessageSocketRequests.ReactToMessage:
            case MessageSocketRequests.VoteInMessagePoll: {
              return handlers[kind]?.({
                message: requestData.message as Message,
              });
            }
            default:
              return;
          }
        } else {
          CHAT_LOGGER.info({ kind });
        }
      } catch (error) {
        CHAT_LOGGER.error(
          { error: error.message },
          "Socket connection to Chatsino-Models experienced an error."
        );
      }
    });
  });

  return {
    request: (
      kind: CombinedSubscriptions,
      args: Record<string, unknown> = {}
    ) =>
      modelSocket.send(
        JSON.stringify({
          from: userId,
          kind,
          args,
        })
      ),
    close: () => {
      hasBeenManuallyClosed = true;
      return modelSocket.close();
    },
  };
}
