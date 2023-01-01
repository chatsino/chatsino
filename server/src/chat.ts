import * as config from "config";
import { sleep } from "helpers";
import { createLogger } from "logger";
import { Observable, Subscriber } from "rxjs";
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

export async function initializeChat() {
  const modelSocket = new WebSocket(config.MODELS_CONNECTION_STRING);

  CHAT_LOGGER.info("Connected to Chatsino-Models -- initializing chat.");

  const chat: Chat = {
    users: [],
    rooms: [],
  };
  const { observable, subscriber } = await new Promise<{
    observable: Observable<Chat>;
    subscriber: Subscriber<Chat>;
  }>((resolve) => {
    const observable = new Observable<Chat>((subscriber) => {
      resolve({
        observable,
        subscriber,
      });
    });
  });

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

      initializeChat();
    });
    modelSocket.on("error", () => {
      CHAT_LOGGER.error(
        "Socket connection to Chatsino-Models experienced an error."
      );
    });
    modelSocket.on("message", (event) => {
      try {
        const {
          kind,
          result: { error, message, data },
        } = JSON.parse(event.toString()) as {
          kind: string;
          result: {
            error: boolean;
            message: string;
            data: Record<string, unknown>;
          };
        };

        CHAT_LOGGER.info(
          { kind, error, message },
          "Received a socket message from Chatsino-Models."
        );

        switch (kind) {
          // Requests
          case UserRequests.GetAllUsers: {
            chat.users = data.users as User[];
            return subscriber.next(chat);
          }
          case RoomRequests.AllPublicRooms: {
            chat.rooms = data.rooms as Room[];
            return subscriber.next(chat);
          }
          // Events
          case UserEvents.UserCreated: {
            chat.users.push(data.user as User);
            return subscriber.next(chat);
          }
          case UserEvents.UserChanged: {
            const user = data.user as User;
            const userIndex = chat.users.findIndex(
              (each) => each.id === user.id
            );

            if (userIndex > -1) {
              const earlierUsers = chat.users.slice(0, userIndex);
              const laterUsers = chat.users.slice(userIndex + 1);

              chat.users = [...earlierUsers, user, ...laterUsers];

              return subscriber.next(chat);
            }
          }
          case RoomEvents.RoomCreated: {
            chat.rooms.push(data.room as Room);
            return subscriber.next(chat);
          }
          case RoomEvents.RoomChanged: {
            const room = data.room as Room;
            const roomIndex = chat.rooms.findIndex(
              (each) => each.id === room.id
            );

            if (roomIndex > -1) {
              const earlierRooms = chat.rooms.slice(0, roomIndex);
              const laterRooms = chat.rooms.slice(roomIndex + 1);

              chat.rooms = [...earlierRooms, room, ...laterRooms];

              return subscriber.next(chat);
            }
          }
        }
      } catch (error) {
        CHAT_LOGGER.error(
          { error },
          "Socket connection to Chatsino-Models experienced an error."
        );
      }
    });
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

  observable.subscribe({
    next(updatedChat) {
      CHAT_LOGGER.info("Chat was updated.");
      // Do stuff.
    },
    error(error: Error) {
      CHAT_LOGGER.info({ error }, "Observable: Error");
    },
    complete() {
      CHAT_LOGGER.info("Observable: Complete");
    },
  });
}
