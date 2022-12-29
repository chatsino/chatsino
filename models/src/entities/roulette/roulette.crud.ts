/* istanbul ignore file */
import { rightNow } from "helpers";
import { executeCommand } from "cache";
import { rouletteErrors } from "./roulette.errors";
import { createRouletteRepository, Roulette } from "./roulette.schema";

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
    executeCommand(async (client) =>
      [await createRouletteRepository(client).fetch(...ids)]
        .flat()
        .filter((roulette) => roulette.id)
    ) as Promise<Roulette[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const roulette = await createRouletteRepository(client).fetch(id);

      if (!roulette.id) {
        throw new rouletteErrors.NotFoundError();
      }

      return roulette;
    }) as Promise<Roulette>,
  update: (id: string, data: Partial<Roulette>) =>
    executeCommand(async (client) => {
      const roulette = await rouletteCrud.read(id);

      Object.assign(roulette, data);

      await createRouletteRepository(client).save(roulette);

      return roulette;
    }) as Promise<Roulette>,
  delete: (id: string) =>
    executeCommand(async (client) =>
      createRouletteRepository(client).remove(id)
    ),
};
