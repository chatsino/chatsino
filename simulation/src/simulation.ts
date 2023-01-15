import axios from "axios";
import { Chance } from "chance";
import * as config from "config";
import {
  CombinedSocketRequests,
  CombinedSocketSubscriptions,
  MessageSocketRequests,
  RoomSocketRequests,
  UserSocketRequests,
} from "enums";
import { createLogger, sleep } from "helpers";
import { RawData, WebSocket } from "ws";

export type SimulatedUser = ReturnType<typeof createSimulatedUser>;

export const SIMULATION_LOGGER = createLogger(config.LOGGER_NAMES.SIMULATION);

export const SIGNED_IN = {} as Record<string, true>;

const CHANCE = new Chance();

export async function runSimulation(user: User) {
  let token: string;

  if (SIGNED_IN[user.username]) {
    // Validate.
    const makeHttpRequest = makeHttpRequestable();
    const { token: validateToken } = (await makeHttpRequest(
      "get",
      "/auth/validate"
    )) as {
      user: User;
      token: string;
    };

    SIMULATION_LOGGER.info("Validated.");

    token = validateToken;
  } else {
    // Sign in.
    const makeHttpRequest = makeHttpRequestable();
    const { token: signinToken } = (await makeHttpRequest(
      "post",
      "/auth/signin",
      {
        username: user.username,
        password: config.SIMULATED_USER_PASSWORD,
      }
    )) as {
      user: User;
      token: string;
    };

    SIGNED_IN[user.username] = true;

    SIMULATION_LOGGER.info("Signed in.");

    token = signinToken;
  }

  const makeHttpRequest = makeHttpRequestable(token);
  const { ticket } = (await makeHttpRequest("get", "/auth/ticket")) as {
    ticket: string;
  };

  SIMULATION_LOGGER.info({ ticket }, "Received a ticket.");

  const socket = await connectToServer(ticket, () => {});
  const makeSocketRequest = makeSocketRequestable(socket);

  let iteration = 0;

  while (++iteration) {
    SIMULATION_LOGGER.info(
      { user: user.username, iteration },
      "Continuing simulation with user."
    );

    // Do other stuff.
    const { users } = (await makeSocketRequest(
      UserSocketRequests.GetAllUsers
    )) as {
      users: User[];
    };
    const { rooms } = (await makeSocketRequest(
      RoomSocketRequests.AllPublicRooms
    )) as {
      rooms: Room[];
    };

    // Create the Lobby if no rooms exist.
    if (rooms.length === 0) {
      const lobby = createSimulatedRoom(user.id);
      lobby.title = "Lobby";
      lobby.description = "Make yourself comfortable.";

      const { room } = (await makeSocketRequest(
        RoomSocketRequests.CreateRoom,
        lobby
      )) as {
        room: Room;
      };

      rooms.push(room);
    }

    const actionHandlers = {
      sendMessage: {
        will: CHANCE.bool({ likelihood: config.MESSAGE_SEND_CHANCE }),
        handler: async () => {
          SIMULATION_LOGGER.info("Sending a message.");

          (await makeSocketRequest(MessageSocketRequests.CreateMessage, {
            roomId: CHANCE.pickone(rooms).id,
            content: CHANCE.sentence(),
          })) as {
            message: Message;
          };
        },
      },
      createRoom: {
        will: CHANCE.bool({ likelihood: config.ROOM_CREATE_CHANCE }),
        handler: async () => {
          SIMULATION_LOGGER.info("Creating a room.");
          // Pass
        },
      },
      signout: {
        will: CHANCE.bool({ likelihood: config.SESSION_CLOSE_CHANCE }),
        handler: async () => {
          SIMULATION_LOGGER.info("Signing out.");

          await makeHttpRequest("post", "/auth/signout");

          delete SIGNED_IN[user.username];
        },
      },
    };
    const actions = Object.keys(actionHandlers) as Array<
      keyof typeof actionHandlers
    >;

    for (const action of actions) {
      const { will, handler } = actionHandlers[action];

      if (will) {
        SIMULATION_LOGGER.info({ action }, "Will perform action.");

        await handler();

        const [minimumWait, maximumWait] = config.SESSION_TICK_RATES_MS;
        const timeBetweenActions = CHANCE.integer({
          min: minimumWait,
          max: maximumWait,
        });

        await sleep(timeBetweenActions);
      } else {
        SIMULATION_LOGGER.info({ action }, "Won't perform action.");
      }
    }

    if (!SIGNED_IN[user.username]) {
      SIMULATION_LOGGER.info(
        "No longer signed in -- no more actions will be taken."
      );

      return true;
    }
  }
}

export async function seedSimulation() {
  SIMULATION_LOGGER.info("Seeding simulation.");

  await Promise.all(
    Array.from({ length: config.MAX_SESSION_COUNT }, () => {
      const simulatedUser = createSimulatedUser();
      const makeHttpRequest = makeHttpRequestable(simulatedUser.username);

      return makeHttpRequest("post", "/auth/signup", simulatedUser);
    })
  );

  SIMULATION_LOGGER.info("Seeding complete.");
}

export async function startSimulation() {
  try {
    const simulatedUsers = await requestSimulatedUsers();

    if (simulatedUsers.length === 0) {
      SIMULATION_LOGGER.info("No simulated users found.");

      // Create set of simulated users and restart simulation.
      await seedSimulation();

      startSimulation();
    } else {
      SIMULATION_LOGGER.info(
        { simulatedUserCount: simulatedUsers.length },
        "Loaded simulated users."
      );

      // Run simulation: starting with one connection, gradually open more connections.
      // During each iteration of the simulation, have each active connection perform zero
      // or more actions that touch various parts of the app.
      await Promise.all(simulatedUsers.map((user) => runSimulation(user)));

      SIMULATION_LOGGER.info("Simulation complete.");
    }
  } catch (error) {
    SIMULATION_LOGGER.error(
      { error: error.message },
      "Simulation experienced an error."
    );

    throw error;
  }
}

// Setup
export async function connectToServer(
  ticket: string,
  onReceiveMessage: (
    kind: CombinedSocketSubscriptions,
    data: Record<string, unknown>
  ) => unknown
) {
  SIMULATION_LOGGER.info("Starting up.");

  const apiSocket = new WebSocket(
    `${config.API_CONNECTION_STRING}?ticket=${ticket}`
  );

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
        kind: CombinedSocketRequests;
        data: Record<string, unknown>;
      };

      if (config.LOG_RESPONSE_DATA) {
        SIMULATION_LOGGER.info({ kind, data }, "Received a socket message.");
      }

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
    username: config.SIMULATED_ENTITY_PREFIX + CHANCE.word({ length: 6 }),
    avatar: CHANCE.avatar(),
    password: config.SIMULATED_USER_PASSWORD,
  };
}

export async function requestSimulatedUsers() {
  SIMULATION_LOGGER.info("Requesting simulated users.");

  const makeHttpRequest = makeHttpRequestable();
  const { users } = (await makeHttpRequest(
    "get",
    `/users?username=${config.SIMULATED_ENTITY_PREFIX}`
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
export function makeHttpRequestable(token = "") {
  return async (
    method: "get" | "post",
    url: string,
    body: Record<string, unknown> = {}
  ) => {
    const fullUrl = [config.API_REQUEST_URL, url].join("");

    type Response = {
      data: {
        error: boolean;
        result: "OK" | "Error";
        message: string;
        data: Record<string, unknown>;
      };
    };

    if (method === "get") {
      const {
        data: { data },
      } = (await axios.get(fullUrl, {
        headers: {
          Authorization: token,
        },
      })) as Response;
      return data;
    } else {
      const {
        data: { data },
      } = (await axios.post(fullUrl, body, {
        headers: {
          Authorization: token,
        },
      })) as Response;
      return data;
    }
  };
}

export function makeSocketRequestable(socket: WebSocket) {
  return (kind: CombinedSocketRequests, args: Record<string, unknown> = {}) =>
    new Promise<Record<string, unknown>>((resolve) => {
      const handleRequest = (message: RawData) => {
        const response = JSON.parse(message.toString()) as {
          kind: CombinedSocketRequests;
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
