import { executeCommand } from "cache/object-mapper";
import { createRouletteRepository, Roulette } from "./roulette.schema";

export const rouletteQueries = {
  activeGame: () =>
    executeCommand(async (client) => {
      const result = await createRouletteRepository(client)
        .search()
        .where("status")
        .does.not.equal("finished")
        .first();

      return result;
    }) as Promise<null | Roulette>,
};
