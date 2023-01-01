import * as config from "config";
import { sleep, updateInPlace } from "helpers";
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

export enum RoomEvents {
  RoomCreated = "room-created",
  RoomChanged = "room-changed",
}

export interface Chat {
  users: User[];
  rooms: Room[];
}

export const CHAT_LOGGER = createLogger(config.LOGGER_NAMES.CHAT);

export enum UserRequests {
  // Queries
  GetUser = "get-user",
  GetAllUsers = "get-all-users",
  GetTotalUsers = "get-total-users",
  GetUserByUsername = "get-user-by-username",
  GetUsersByUsernameList = "get-users-by-username-list",
  GetAllModerators = "get-all-moderators",
  GetAllAdministrators = "get-all-administrators",
  GetAllOperators = "get-all-operators",
  GetBannedUsers = "get-banned-users",
  GetCanUserAfford = "get-can-user-afford",
  GetIsCorrectPassword = "get-is-correct-password",

  // Mutations
  CreateUser = "create-user",
  ReassignUser = "reassign-user",
  TempbanUser = "tempban-user",
  PermabanUser = "permaban-user",
  ChargeUser = "charge-user",
  PayUser = "pay-user",
  ChangeUserPassword = "change-user-password",
}

export enum UserEvents {
  UserCreated = "user-created",
  UserChanged = "user-changed",
}

export enum RoomRequests {
  // Queries
  Room = "room",
  AllRooms = "all-rooms",
  AllPublicRooms = "all-public-rooms",
  TotalRooms = "total-rooms",
  RoomByID = "room-by-id",
  RoomByRoomTitle = "room-by-room-title",
  MeetsRoomPermissionRequirement = "meets-room-permission-requirement",
  RoomUsers = "room-users",
  RoomMessages = "room-messages",

  // Mutations
  CreateRoom = "create-room",
  UpdateRoom = "update-room",
  JoinRoom = "join-room",
  LeaveRoom = "leave-room",
  ToggleCoOwner = "toggle-co-owner",
  ToggleBlacklisted = "toggle-blacklisted",
  ToggleWhitelisted = "toggle-whitelisted",
  ToggleMuted = "toggle-muted",
  SendMessage = "send-message",
  SendDirectMessage = "send-direct-message",
  PinMessage = "pin-message",
  RemoveMessage = "remove-message",
  RemoveUserMessages = "remove-user-messages",
}

let fibonacciRolloffIndex = 0;

export async function initializeChat(
  onChange: (chat: Chat) => unknown = () => {}
) {
  const modelSocket = new WebSocket(config.MODELS_CONNECTION_STRING);

  await new Promise<void>((resolve) => {
    modelSocket.on("open", () => {
      CHAT_LOGGER.info("Socket connection to Chatsino-Models established.");

      fibonacciRolloffIndex = 0;

      resolve();
    });
    modelSocket.on("close", async () => {
      CHAT_LOGGER.info("Socket connection to Chatsino-Models terminated.");

      const duration =
        config.MODELS_RECONNECT_ATTEMPT_RATES_MS[fibonacciRolloffIndex++] ??
        config.MODELS_RECONNECT_ATTEMPT_RATES_MS[
          config.MODELS_RECONNECT_ATTEMPT_RATES_MS.length - 1
        ];

      await sleep(duration);

      CHAT_LOGGER.info(
        { attempt: fibonacciRolloffIndex },
        "Attempting to reconnect to Chatsino-Models."
      );

      return initializeChat(onChange);
    });
    modelSocket.on("error", (error) => {
      CHAT_LOGGER.error(
        { error },
        "Socket connection to Chatsino-Models experienced an error."
      );
    });
  });

  const chat: Chat = {
    users: [],
    rooms: [],
  };

  modelSocket.on("message", (event) => {
    try {
      const { kind, result, data } = JSON.parse(event.toString()) as {
        kind: string;
        // For Requests:
        result?: {
          error: boolean;
          message: string;
          data: Record<string, unknown>;
        };
        // For Events:
        data?: Record<string, unknown>;
      };

      if (kind === "info") {
        return;
      }

      if (data) {
        CHAT_LOGGER.info(
          { kind },
          "Received a published event from Chatsino-Models."
        );

        const user = data.user as User;
        const room = data.room as Room;

        switch (kind) {
          case UserEvents.UserCreated: {
            chat.users.push(user);
          }
          case UserEvents.UserChanged: {
            chat.users = updateInPlace(user, chat.users);
          }
          case RoomEvents.RoomCreated: {
            chat.rooms.push(room);
          }
          case RoomEvents.RoomChanged: {
            chat.rooms = updateInPlace(room, chat.rooms);
          }
          default:
            return onChange(chat);
        }
      } else {
        const { error, message, data: requestData } = result!;

        CHAT_LOGGER.info(
          { error, message, kind },
          "Received a response from Chatsino-Models."
        );

        const users = requestData.users as User[];
        const rooms = requestData.rooms as Room[];

        switch (kind) {
          case UserRequests.GetAllUsers: {
            chat.users = users;
          }
          case RoomRequests.AllPublicRooms: {
            chat.rooms = rooms;
          }
          default:
            return onChange(chat);
        }
      }
    } catch (error) {
      CHAT_LOGGER.error(
        { error },
        "Socket connection to Chatsino-Models experienced an error."
      );
    }
  });

  modelSocket.send(
    JSON.stringify({
      kind: UserRequests.GetAllUsers,
    })
  );
  modelSocket.send(
    JSON.stringify({
      kind: RoomRequests.AllPublicRooms,
    })
  );
}
