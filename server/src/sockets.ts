import { initializeChat, Room, User } from "chat";
import * as config from "config";
import {
  CombinedRequests,
  RoomSocketRequests,
  UserSocketRequests,
} from "enums";
import { guid } from "helpers";
import { Server } from "http";
import { createLogger } from "logger";
import { WebSocket, WebSocketServer } from "ws";

export const SOCKETS_LOGGER = createLogger(config.LOGGER_NAMES.SOCKET_SERVER);

export function initializeSocketServer(server: Server) {
  const socketServer = new WebSocketServer({ noServer: true });
  const clients = {
    toId: new Map<WebSocket, string>(),
    toWebSocket: new Map<string, WebSocket>(),
  };
  const heartbeats = new Map<WebSocket, boolean>();
  const heartbeat = (websocket: WebSocket) => heartbeats.set(websocket, true);
  const sendMessage = <T extends { kind: string }>(
    websocket: WebSocket,
    data: T
  ) => websocket.send(JSON.stringify(data));
  const checkForDisconnectedClients = () => {
    for (const client of socketServer.clients) {
      if (heartbeats.get(client)) {
        heartbeats.set(client, false);
        client.ping();
      } else {
        client.terminate();
      }
    }

    checkingForDisconnectedClients = setTimeout(
      checkForDisconnectedClients,
      config.CONNECTION_STATUS_CHECK_RATE_MS
    );
  };

  socketServer.on("connection", async (websocket) => {
    SOCKETS_LOGGER.info("A new client connected.");

    const chat = await initializeChat({
      [UserSocketRequests.GetAllUsers]: (data: { users: User[] }) =>
        sendMessage(websocket, {
          kind: UserSocketRequests.GetAllUsers,
          data,
        }),
      [RoomSocketRequests.AllPublicRooms]: (data: { rooms: Room[] }) =>
        sendMessage(websocket, {
          kind: RoomSocketRequests.AllPublicRooms,
          data,
        }),
      [UserSocketRequests.CreateUser]: (data: { user: User }) =>
        sendMessage(websocket, {
          kind: UserSocketRequests.CreateUser,
          data,
        }),
      [RoomSocketRequests.CreateRoom]: (data: { room: Room }) =>
        sendMessage(websocket, {
          kind: RoomSocketRequests.CreateRoom,
          data,
        }),
    });

    websocket.on("pong", () => heartbeat(websocket));
    websocket.on("close", () => {
      SOCKETS_LOGGER.info("A client's connection was closed.");

      const id = clients.toId.get(websocket) as string;
      clients.toId.delete(websocket);
      clients.toWebSocket.delete(id);

      heartbeats.delete(websocket);

      chat.close();
    });
    websocket.on("message", (data) => {
      const { kind, args } = JSON.parse(data.toString()) as {
        kind: CombinedRequests;
        args?: Record<string, unknown>;
      };

      SOCKETS_LOGGER.info({ kind, args }, "Received a message from a client.");

      if (!kind) {
        throw new Error("Received message is missing a handler kind.");
      }

      return chat.request(kind, args);
    });
  });

  server.on("upgrade", async (request, socket, head) => {
    const websocket = await new Promise<WebSocket>((resolve) =>
      socketServer.handleUpgrade(request, socket, head, resolve)
    );

    const userId = guid();
    clients.toId.set(websocket, userId);
    clients.toWebSocket.set(userId, websocket);

    heartbeats.set(websocket, true);

    return socketServer.emit("connection", websocket);
  });

  let checkingForDisconnectedClients: NodeJS.Timeout;

  checkingForDisconnectedClients = setTimeout(
    checkForDisconnectedClients,
    config.CONNECTION_STATUS_CHECK_RATE_MS
  );
}
