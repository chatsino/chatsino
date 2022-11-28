import { SUBSCRIBER } from "persistence";
import { createLogger } from "logger";

export const BLACKJACK_LOGGER = createLogger("Blackjack");

export enum BlackjackSocketRequests {
  GetActiveBlackjackGame = "get-active-blackjack-game",
  StartBlackjackGame = "start-blackjack-game",
  TakeBlackjackAction = "take-blackjack-action",
}

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

export function handleGetActiveBlackjackGame() {
  BLACKJACK_LOGGER.info(BlackjackSocketRequests.GetActiveBlackjackGame);
}

export function handleStartBlackjackGame() {
  BLACKJACK_LOGGER.info(BlackjackSocketRequests.StartBlackjackGame);
}

export function handleTakeBlackjackAction() {
  BLACKJACK_LOGGER.info(BlackjackSocketRequests.TakeBlackjackAction);
}
