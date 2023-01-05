import axios from "axios";
import { Chance } from "chance";
import * as config from "config";
import {
  CombinedRequests,
  CombinedSubscriptions,
  RoomSocketEvents,
  RoomSocketRequests,
  UserSocketEvents,
  UserSocketRequests,
} from "enums";
import { createLogger, sleep } from "helpers";
import { RawData, WebSocket } from "ws";

export type SimulatedUser = ReturnType<typeof createSimulatedUser>;

export const SIMULATION_LOGGER = createLogger(config.LOGGER_NAMES.SIMULATION);

const CHANCE = new Chance();

export async function startSimulation() {
  const connections = [] as SimulatedUser[];
  const knownUsers = [] as SimulatedUser[];

  let mostRecentConnection: null | SimulatedUser = null;
  let ticks = 0;

  const apiSocket = await connectToServer((kind, data) => {
    switch (kind) {
      case UserSocketEvents.UserCreated: {
        console.log("user created", data);
        return allUsers.push(data.user as User);
      }
      case RoomSocketEvents.RoomCreated: {
        return publicRooms.push(data.room as Room);
      }
    }
  });
  const makeSocketRequest = makeSocketRequestable(apiSocket);

  const simulatedUsers = await requestSimulatedUsers(apiSocket);

  if (simulatedUsers.length === 0) {
    SIMULATION_LOGGER.info("No simulated users found.");

    // Create set of simulated users and restart simulation.
  } else {
    SIMULATION_LOGGER.info(
      { simulatedUserCount: simulatedUsers.length },
      "Loaded simulated users."
    );

    // Run simulation: starting with one connection, gradually open more connections.
    // During each iteration of the simulation, have each active connection perform zero
    // or more actions that touch various parts of the app.
  }

  return;

  const { users: allUsers } = (await makeSocketRequest(
    UserSocketRequests.GetAllUsers
  )) as {
    users: User[];
  };
  const { rooms: publicRooms } = (await makeSocketRequest(
    RoomSocketRequests.AllPublicRooms
  )) as {
    rooms: Room[];
  };

  while (++ticks) {
    // There's a chance a new session opens.
    if (connections.length < config.MAX_SESSION_COUNT) {
      const willOpenSession =
        connections.length === 0 ||
        CHANCE.bool({
          likelihood: config.SESSION_OPEN_CHANCE,
        });

      if (willOpenSession) {
        SIMULATION_LOGGER.info("Opening a session.");

        const [availableUser] = knownUsers.filter(
          (user) => !connections.some((each) => each.username === user.username)
        );

        if (availableUser) {
          // Sign in.
          await makePostRequest("/auth/signin", {
            username: availableUser.username,
            password: availableUser.password,
          });

          SIMULATION_LOGGER.info({ user: availableUser }, "Signed in.");

          // Retrieve ticket.
          const {
            data: { ticket },
          } = await makeGetRequest("/auth/ticket");

          SIMULATION_LOGGER.info({ ticket }, "Received a ticket.");

          mostRecentConnection = availableUser;

          connections.push(availableUser);
        } else {
          // Sign up.
          const newUser = createSimulatedUser();
          const {
            data: { user },
          } = (await makePostRequest("/auth/signup", newUser)) as {
            data: {
              user: User;
            };
          };

          SIMULATION_LOGGER.info({ user }, "Signed up.");

          mostRecentConnection = availableUser;

          connections.push(newUser);
          allUsers.push(user);
        }
      }
    }

    // There's a chance a new session closes.
    if (connections.length > 1) {
      const willCloseSession = CHANCE.bool({
        likelihood: config.SESSION_OPEN_CHANCE,
      });

      if (willCloseSession) {
        SIMULATION_LOGGER.info("Closing a session.");

        let signedOutUser = CHANCE.pickone(connections);

        if (mostRecentConnection) {
          while (signedOutUser.username === mostRecentConnection.username) {
            signedOutUser = CHANCE.pickone(connections);
          }
        }

        await makePostRequest("/auth/signout");

        SIMULATION_LOGGER.info({ user: signedOutUser }, "Signed out.");
      }
    }

    // Each connection takes a series of actions:
    for (const connection of connections) {
      const user = simulatedUsers.find(
        (each) => each.username === connection.username
      )!;

      // ...sending a message to a room.
      const willSendMessage = CHANCE.bool({
        likelihood: config.MESSAGE_SEND_CHANCE,
      });

      if (willSendMessage) {
        SIMULATION_LOGGER.info({ user }, "User will send a message...");

        if (publicRooms.length === 0) {
          // A room doesn't exist -- we need to create one.
          SIMULATION_LOGGER.info(
            { user },
            "...no rooms exist -- creating one."
          );

          apiSocket.send(
            JSON.stringify({
              kind: RoomSocketRequests.CreateRoom,
              args: createSimulatedRoom(user.id),
            })
          );
        } else {
          const room = CHANCE.pickone(publicRooms);

          SIMULATION_LOGGER.info({ room }, "...to a room.");

          apiSocket.send(
            JSON.stringify({
              kind: RoomSocketRequests.SendMessage,
              args: {
                roomId: room.id,
                userId: user.id,
                content: CHANCE.sentence(),
              },
            })
          );
        }
      }

      // ...creating a new room.
      // const willCreateRoom = CHANCE.bool({
      //   likelihood: config.ROOM_CREATE_CHANCE,
      // });

      // if (willCreateRoom) {
      //   SIMULATION_LOGGER.info({ user }, "User will create a room.");

      //   apiSocket.send(
      //     JSON.stringify({
      //       kind: RoomSocketRequests.CreateRoom,
      //       args: createSimulatedRoom(user.id),
      //     })
      //   );
      // }
    }

    // Done: wait for the next tick.
    SIMULATION_LOGGER.info(
      { ticks, connections: connections.length },
      "Tick complete."
    );

    const [minimumWait, maximumWait] = config.SESSION_TICK_RATES_MS;
    const timetoWait = CHANCE.integer({ min: minimumWait, max: maximumWait });

    await sleep(timetoWait);
  }
}

// Setup
export async function connectToServer(
  onReceiveMessage: (
    kind: CombinedSubscriptions,
    data: Record<string, unknown>
  ) => unknown
) {
  SIMULATION_LOGGER.info("Starting up.");

  const apiSocket = new WebSocket(config.API_CONNECTION_STRING);

  apiSocket.on("open", () => {
    SIMULATION_LOGGER.info("Socket connection to Chatsino-Server established.");
  });
  apiSocket.on("close", () => {
    SIMULATION_LOGGER.info("Socket connection to Chatsino-Server terminated.");
  });
  apiSocket.on("error", () => {
    SIMULATION_LOGGER.info(
      "Socket connection to Chatsino-Server experienced an error."
    );
  });
  apiSocket.on("message", async (message) => {
    try {
      const { kind, data } = JSON.parse(message.toString()) as {
        kind: CombinedRequests;
        data: Record<string, unknown>;
      };

      SIMULATION_LOGGER.info({ kind, data }, "Received a socket message.");

      return onReceiveMessage(kind, data);
    } catch (error) {
      SIMULATION_LOGGER.error(
        { error: error.message },
        "Unable to handle socket message."
      );
    }
  });

  while (apiSocket.readyState !== apiSocket.OPEN) {
    await sleep(100);
  }

  return apiSocket;
}

// Simulated Entities
export function createSimulatedUser() {
  return {
    username: `${CHANCE.word({ length: 6 })}`,
    avatar: CHANCE.avatar(),
    password: CHANCE.word({ length: 8 }),
  };
}

export async function requestSimulatedUsers(socket: WebSocket) {
  SIMULATION_LOGGER.info("Requesting simulated users.");

  const makeSocketRequest = makeSocketRequestable(socket);
  const { users } = (await makeSocketRequest(
    UserSocketRequests.GetUsersWithUsername,
    { username: config.SIMULATED_ENTITY_PREFIX }
  )) as { users: User[] };

  return users;
}

export function createSimulatedRoom(ownerId: string) {
  return {
    ownerId,
    avatar: CHANCE.avatar(),
    title: `SIM_${CHANCE.word({ length: 8 })}`,
    description: `${CHANCE.sentence()}`,
  };
}

// Requests
export async function makeHttpRequest(
  method: "get" | "post",
  url: string,
  body: Record<string, unknown> = {}
) {
  const { data } = await axios[method](
    [config.API_REQUEST_URL, url].join(""),
    body
  );

  return data;
}

export const makeGetRequest = makeHttpRequest.bind(null, "get");
export const makePostRequest = makeHttpRequest.bind(null, "post");

export function makeSocketRequestable(socket: WebSocket) {
  return (kind: CombinedRequests, args: Record<string, unknown> = {}) =>
    new Promise<Record<string, unknown>>((resolve) => {
      const handleRequest = (message: RawData) => {
        const response = JSON.parse(message.toString()) as {
          kind: CombinedRequests;
          data: Record<string, unknown>;
        };

        if (response.kind === kind) {
          socket.off("message", handleRequest);
          resolve(response.data);
        }
      };

      socket.on("message", handleRequest);

      socket.send(
        JSON.stringify({
          kind,
          args,
        })
      );
    });
}
