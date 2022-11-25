import { subscriber } from "persistence";

export enum BlackjackSocketMessages {
  GetActiveBlackjackGame = "get-active-blackjack-game",
  StartBlackjackGame = "start-blackjack-game",
  TakeBlackjackAction = "take-blackjack-action",
}

export function initializeBlackjackManager() {
  subscriber.on(
    BlackjackSocketMessages.GetActiveBlackjackGame,
    handleGetActiveBlackjackGame
  );
  subscriber.on(
    BlackjackSocketMessages.StartBlackjackGame,
    handleStartBlackjackGame
  );
  subscriber.on(
    BlackjackSocketMessages.TakeBlackjackAction,
    handleTakeBlackjackAction
  );
}

export function handleGetActiveBlackjackGame() {}

export function handleStartBlackjackGame() {}

export function handleTakeBlackjackAction() {}
