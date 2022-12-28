/* istanbul ignore file */
import { executeCommand } from "object-mapper";
import { rightNow } from "helpers";
import { createSniperRepository, Sniper } from "./sniper.schema";
import { SniperNotFoundError } from "./sniper.types";

export const sniperCrud = {
  create: async () =>
    executeCommand(async (client) => {
      const repository = createSniperRepository(client);
      const sniper = repository.createEntity({
        startedAt: rightNow(),
        status: "open",
        snipes: [],
        participants: [],
        pot: 0,
        winner: "",
      });

      sniper.id = sniper.entityId;

      await repository.save(sniper);

      return sniper;
    }) as Promise<Sniper>,
  readList: (...ids: string[]) =>
    executeCommand(async (client) => {
      const snipers = await createSniperRepository(client).fetch(...ids);

      return [snipers].flat().filter((sniper) => sniper.id);
    }) as Promise<Sniper[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const sniper = await createSniperRepository(client).fetch(id);

      if (!sniper) {
        throw new SniperNotFoundError();
      }

      return sniper;
    }) as Promise<Sniper>,
  update: (id: string, data: Partial<Sniper>) =>
    executeCommand(async (client) => {
      const repository = createSniperRepository(client);
      const sniper = await sniperCrud.read(id);

      sniper.startedAt = data.startedAt ?? sniper.startedAt;
      sniper.status = data.status ?? sniper.status;
      sniper.snipes = data.snipes ?? sniper.snipes;
      sniper.participants = data.participants ?? sniper.participants;
      sniper.pot = data.pot ?? sniper.pot;
      sniper.winner = data.winner ?? sniper.winner;

      await repository.save(sniper);

      return sniper;
    }) as Promise<Sniper>,
  delete: (id: string) =>
    executeCommand(async (client) => createSniperRepository(client).remove(id)),
};
