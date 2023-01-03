import axios from "axios";
import { Chance } from "chance";
import * as config from "config";
import { CombinedRequests } from "enums";
import { createLogger, sleep } from "helpers";
import { WebSocket } from "ws";

export type SimulatedUser = ReturnType<typeof createSimulatedUser>;

export const SIMULATION_LOGGER = createLogger(config.LOGGER_NAMES.SIMULATION);

const CHANCE = new Chance();

export async function startSimulation() {
  // const apiSocket = await connectToServer();
  const connections = [] as SimulatedUser[];
  const knownUsers = [] as SimulatedUser[];
  let mostRecentConnection: null | SimulatedUser = null;
  let ticks = 0;

  while (++ticks) {
    SIMULATION_LOGGER.info({ tick: ticks }, "Ticks.");

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
          const { ticket } = await makeGetRequest("/auth/ticket");

          SIMULATION_LOGGER.info({ ticket }, "Received a ticket.");

          mostRecentConnection = availableUser;

          connections.push(availableUser);
        } else {
          // Sign up.
          const newUser = createSimulatedUser();

          await makePostRequest("/auth/signup", newUser);

          SIMULATION_LOGGER.info({ user: newUser }, "Signed up.");

          mostRecentConnection = availableUser;

          connections.push(newUser);
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

    // Wait for the next tick.
    SIMULATION_LOGGER.info(
      { connections: connections.length },
      "Tick complete."
    );

    const [minimumWait, maximumWait] = config.SESSION_TICK_RATES_MS;
    const timetoWait = CHANCE.integer({ min: minimumWait, max: maximumWait });

    await sleep(timetoWait);
  }
}

export async function connectToServer() {
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

export function createSimulatedUser() {
  return {
    username: CHANCE.word({ length: 6 }),
    avatar: CHANCE.avatar(),
    password: CHANCE.word({ length: 8 }),
  };
}

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
