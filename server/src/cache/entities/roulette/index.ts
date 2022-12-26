import { rouletteCrud } from "./roulette.crud";
import { createRouletteIndex, rouletteSchema } from "./roulette.schema";
import { rouletteQueries } from "./roulette.queries";
import { rouletteMutations } from "./roulette.mutations";

export * from "./roulette.config";
export * from "./roulette.types";

export class RouletteEntity {
  public static createIndex = createRouletteIndex;
  public static crud = rouletteCrud;
  public static schema = rouletteSchema;
  public static queries = rouletteQueries;
  public static mutations = rouletteMutations;
}
