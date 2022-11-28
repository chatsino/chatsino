import { subscriber } from "persistence";
import { createLogger } from "logger";

export const BLACKJACK_LOGGER = createLogger("Blackjack");

export enum BlackjackSocketRequests {
  GetActiveBlackjackGame = "get-active-blackjack-game",
  StartBlackjackGame = "start-blackjack-game",
  TakeBlackjackAction = "take-blackjack-action",
}

export function initializeBlackjackManager() {
  subscriber.subscribe(
    BlackjackSocketRequests.GetActiveBlackjackGame,
    handleGetActiveBlackjackGame
  );
  subscriber.subscribe(
    BlackjackSocketRequests.StartBlackjackGame,
    handleStartBlackjackGame
  );
  subscriber.subscribe(
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
