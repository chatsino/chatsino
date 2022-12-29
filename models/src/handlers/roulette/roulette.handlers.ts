import { SUBSCRIBER } from "cache";
import { RouletteEntity } from "entities";
import { parseRequest, respondTo } from "../common";
import { RouletteRequests } from "./roulette.requests";

export const initializeRouletteHandlers = () => {
  // Queries
  SUBSCRIBER.subscribe(RouletteRequests.GetActiveGame, async (message) => {
    const { socketId, kind } = parseRequest(message);
    const game = await RouletteEntity.queries.activeGame();

    try {
      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully got active game.",
        data: {
          game: game ? game.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to get active game.",
        data: {
          game: null,
        },
      });
    }
  });
  // Mutations
  SUBSCRIBER.subscribe(RouletteRequests.HandleGame, async (message) => {
    const { socketId, kind } = parseRequest(message);
    const game = await RouletteEntity.mutations.handleGame();

    try {
      return respondTo(socketId, kind, {
        error: false,
        message: "Successfully handled game.",
        data: {
          game: game ? game.fields : null,
        },
      });
    } catch (error) {
      return respondTo(socketId, kind, {
        error: true,
        message: "Unable to handle game.",
        data: {
          game: null,
        },
      });
    }
  });
};
