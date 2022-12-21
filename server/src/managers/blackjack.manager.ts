import { BlackjackSocketRequests } from "enums";
import { GameInProgressError, NoGameInProgressError } from "games";
import { createLogger } from "logger";
import {
  CannotAffordWagerError,
  getClientBlackjackGame,
  startBlackjackGame,
} from "models";
import { SUBSCRIBER } from "persistence";
import {
  getActiveBlackjackGameSchema,
  SourcedSocketMessage,
  startBlackjackGameActionSchema,
} from "schemas";
import { SocketServer } from "socket-server";
import * as yup from "yup";

export const BLACKJACK_LOGGER = createLogger("Blackjack");

export function initializeBlackjackManager() {
  SUBSCRIBER.subscribe(
    BlackjackSocketRequests.GetActiveBlackjackGame,
    handleGetActiveBlackjackGame
  );
  SUBSCRIBER.subscribe(
    BlackjackSocketRequests.StartBlackjackGame,
    handleStartBlackjackGame
  );
  SUBSCRIBER.subscribe(
    BlackjackSocketRequests.TakeBlackjackAction,
    handleTakeBlackjackAction
  );
}

export async function handleGetActiveBlackjackGame(message: string) {
  const { kind, args, from } = JSON.parse(message) as SourcedSocketMessage;

  try {
    const { clientId } = await getActiveBlackjackGameSchema.validate(args);

    return SocketServer.success(
      from.id,
      kind,
      (await getClientBlackjackGame(clientId)).data
    );
  } catch (error) {
    return handleBlackjackErrors(
      from.id,
      kind,
      error,
      "Unable to get active blackjack game."
    );
  }
}

export async function handleStartBlackjackGame(message: string) {
  const { kind, args, from } = JSON.parse(message) as SourcedSocketMessage;

  try {
    const { wager } = await startBlackjackGameActionSchema.validate(args);

    return SocketServer.success(
      from.id,
      kind,
      (await startBlackjackGame(from.id, wager)) ?? null
    );
  } catch (error) {
    return handleBlackjackErrors(
      from.id,
      kind,
      error,
      "Unable to start a blackjack game."
    );
  }
}

export function handleTakeBlackjackAction() {
  BLACKJACK_LOGGER.info(BlackjackSocketRequests.TakeBlackjackAction);
}

export function handleBlackjackErrors(
  to: number,
  kind: string,
  error: unknown,
  fallback: string
) {
  const sendError = (message: string) => SocketServer.error(to, kind, message);

  if (error instanceof CannotAffordWagerError) {
    return sendError("You cannot afford that wager.");
  }

  if (error instanceof GameInProgressError) {
    return sendError("You already have a blackjack game in progress.");
  }

  if (error instanceof NoGameInProgressError) {
    return sendError("You do not have a game of blackjack in progress.");
  }

  if (error instanceof yup.ValidationError) {
    return sendError("Validation errors detected.");
  }

  if (error instanceof Error) {
    return sendError(fallback);
  }
}
