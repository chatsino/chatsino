import { executeCommand } from "cache/object-mapper";
import { createRouletteRepository } from "./roulette.schema";
import { RouletteNotFoundError } from "./roulette.types";

export const rouletteQueries = {
  activeGame: () =>
    executeCommand(async (client) => {
      const result = createRouletteRepository(client)
        .search()
        .where("status")
        .does.not.equal("finished")
        .first();

      if (!result) {
        throw new RouletteNotFoundError();
      }

      return result;
    }),
};
