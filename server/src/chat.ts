import * as config from "config";
import {
  CombinedSubscriptions,
  RoomSocketEvents,
  RoomSocketRequests,
  UserSocketEvents,
  UserSocketRequests,
} from "enums";
import { guid, sleep } from "helpers";
import { createLogger } from "logger";
import { WebSocket } from "ws";

export interface User {
  id: string;
  createdAt: string;
  changedAt: string;
  avatar: string;
  username: string;
  chips: number;
  sessionCount: number;
  lastActive: string;
  role: "user" | "moderator" | "administrator" | "operator";
  banDuration: number;
  hash: string;
  salt: string;
}

export interface Room {
  id: string;
  ownerId: string;
  createdAt: string;
  changedAt: string;
  avatar: string;
  title: string;
  description: string;
  password: string;
  users: string[];
  permissions: string[];
  messages: string[];
  pins: string[];
}

export type ChatHandlers = Record<
  string,
  undefined | ((data: unknown) => unknown)
>;

export const CHAT_LOGGER = createLogger(config.LOGGER_NAMES.CHAT);

const rolloffIndices: Record<string, number> = {};

export async function initializeChat(handlers: ChatHandlers) {
  const chatId = guid();
  const modelSocket = new WebSocket(config.MODELS_CONNECTION_STRING);

  let hasBeenManuallyClosed = false;

  await new Promise<void>((resolve) => {
    modelSocket.on("open", () => {
      CHAT_LOGGER.info("Socket connection to Chatsino-Models established.");

      rolloffIndices[chatId] = 0;

      resolve();
    });
    modelSocket.on("close", async () => {
      CHAT_LOGGER.info("Socket connection to Chatsino-Models terminated.");

      if (!hasBeenManuallyClosed) {
        const duration =
          config.MODELS_RECONNECT_ATTEMPT_RATES_MS[rolloffIndices[chatId]++] ??
          config.MODELS_RECONNECT_ATTEMPT_RATES_MS[
            config.MODELS_RECONNECT_ATTEMPT_RATES_MS.length - 1
          ];

        await sleep(duration);

        CHAT_LOGGER.info(
          { attempt: rolloffIndices[chatId] },
          "Attempting to reconnect to Chatsino-Models."
        );

        return initializeChat(handlers);
      }
    });
    modelSocket.on("error", (error) => {
      CHAT_LOGGER.error(
        { error: error.message },
        "Socket connection to Chatsino-Models experienced an error."
      );
    });
  });

  modelSocket.on("message", (event) => {
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
        CHAT_LOGGER.info(
          { kind },
          "Received a published event from Chatsino-Models."
        );

        const user = data.user as User;
        const room = data.room as Room;

        switch (kind) {
          case UserSocketEvents.UserCreated:
          case UserSocketEvents.UserChanged: {
            return handlers[kind]?.({ user });
          }
          case RoomSocketEvents.RoomCreated:
          case RoomSocketEvents.RoomChanged: {
            return handlers[kind]?.({ room });
          }
          default:
            return;
        }
      } else if (result) {
        const { error, message, data: requestData } = result;

        CHAT_LOGGER.info(
          { error, message, kind },
          "Received a response from Chatsino-Models."
        );

        switch (kind) {
          case UserSocketRequests.GetAllUsers: {
            return handlers[kind]?.({ users: requestData.users as User[] });
          }
          case RoomSocketRequests.AllPublicRooms: {
            return handlers[kind]?.({ rooms: requestData.rooms as Room[] });
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

  return {
    request: (
      kind: CombinedSubscriptions,
      args: Record<string, unknown> = {}
    ) => {
      return modelSocket.send(
        JSON.stringify({
          kind,
          args,
        })
      );
    },
    close: () => {
      hasBeenManuallyClosed = true;
      return modelSocket.close();
    },
  };
}
