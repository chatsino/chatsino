import * as config from "config";
import { ClientSocketRequests } from "enums";
import {
  parseSourcedSocketMessage,
  PreparsedSourcedSocketMessage,
} from "helpers";
import { createLogger } from "logger";
import { getClientByUsername } from "models";
import { clientTokenExpiredSchema } from "schemas";
import { SocketServer } from "socket-server";

export const CLIENT_MANAGER_LOGGER = createLogger(
  config.LOGGER_NAMES.CLIENT_MANAGER
);

export function initializeClientManager() {
  // TODO
}

export async function handleClientTokenExpired(
  sourcedSocketMessage: PreparsedSourcedSocketMessage
) {
  const { from, kind, args } = parseSourcedSocketMessage(sourcedSocketMessage);

  try {
    const { username } = await clientTokenExpiredSchema.validate(args);
    const client = await getClientByUsername(username);

    if (!client) {
      throw new Error(`No client exists with username ${username}.`);
    }

    // TODO: Change this to only broadcast to the client in question.
    await SocketServer.success(
      client.id,
      ClientSocketRequests.ClientTokenExpired
    );

    return SocketServer.success(from.id, kind, {
      message: `Alerted Client#${client.id} that their token has expired.`,
    });
  } catch (error) {
    CLIENT_MANAGER_LOGGER.error(
      { error },
      "Failed to handle expired client token."
    );

    return handleClientErrors(
      from.id,
      kind,
      error,
      "Failed to handle expired client token."
    );
  }
}

export function handleClientErrors(
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
