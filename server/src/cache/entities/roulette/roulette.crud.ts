import { executeCommand } from "cache/object-mapper";
import { rightNow } from "helpers";
import { createRouletteRepository, Roulette } from "./roulette.schema";
import { RouletteNotFoundError } from "./roulette.types";

export const rouletteCrud = {
  create: async () =>
    executeCommand(async (client) => {
      const repository = createRouletteRepository(client);
      const roulette = repository.createEntity({
        startedAt: rightNow(),
        status: "taking-bets",
        bets: [],
        results: [],
        participants: [],
        outcome: -1,
      });

      roulette.id = roulette.entityId;

      await repository.save(roulette);

      return roulette;
    }) as Promise<Roulette>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) => {
      const roulettes = await createRouletteRepository(client).fetch(...ids);

      return [roulettes].flat().filter((roulette) => roulette.id);
    }) as Promise<Roulette[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const roulette = await createRouletteRepository(client).fetch(id);

      if (!roulette) {
        throw new RouletteNotFoundError();
      }

      return roulette;
    }) as Promise<Roulette>,
  update: (id: string, data: Partial<Roulette>) =>
    executeCommand(async (client) => {
      const repository = createRouletteRepository(client);
      const roulette = await rouletteCrud.read(id);

      roulette.startedAt = data.startedAt ?? roulette.startedAt;
      roulette.status = data.status ?? roulette.status;
      roulette.bets = data.bets ?? roulette.bets;
      roulette.results = data.results ?? roulette.results;
      roulette.participants = data.participants ?? roulette.participants;
      roulette.outcome = data.outcome ?? roulette.outcome;

      await repository.save(roulette);

      return roulette;
    }) as Promise<Roulette>,
  delete: (id: string) =>
    executeCommand(async (client) =>
      createRouletteRepository(client).remove(id)
    ),
};
