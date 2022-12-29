export const rouletteErrors = {
  NoGameInProgressError: class extends Error {
    statusCode = 403;
    message = "There is no game in progress.";
  },
  CannotPlaceBetError: class extends Error {
    statusCode = 403;
    message = "Betting is closed for this game.";
  },
  CannotFinishError: class extends Error {
    statusCode = 403;
    message = "This game is not ready to finish.";
  },
  /* istanbul ignore next */
  NotFoundError: class extends Error {
    statusCode = 404;
    message = "That game of roulette does not exist.";
  },
};
