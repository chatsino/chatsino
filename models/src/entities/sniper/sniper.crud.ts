/* istanbul ignore file */
import { rightNow } from "helpers";
import { executeCommand } from "cache";
import { sniperErrors } from "./sniper.errors";
import { createSniperRepository, Sniper } from "./sniper.schema";

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
    executeCommand(async (client) =>
      [await createSniperRepository(client).fetch(...ids)]
        .flat()
        .filter((sniper) => sniper.id)
    ) as Promise<Sniper[]>,
  read: (id: string) =>
    executeCommand(async (client) => {
      const sniper = await createSniperRepository(client).fetch(id);

      if (!sniper) {
        throw new sniperErrors.NotFoundError();
      }

      return sniper;
    }) as Promise<Sniper>,
  update: (id: string, data: Partial<Sniper>) =>
    executeCommand(async (client) => {
      const sniper = await sniperCrud.read(id);

      Object.assign(sniper, data);

      await createSniperRepository(client).save(sniper);

      return sniper;
    }) as Promise<Sniper>,
  delete: (id: string) =>
    executeCommand(async (client) => createSniperRepository(client).remove(id)),
};
