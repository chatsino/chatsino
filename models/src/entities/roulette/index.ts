import { rouletteCrud } from "./roulette.crud";
import { rouletteErrors } from "./roulette.errors";
import { rouletteMutations } from "./roulette.mutations";
import { rouletteQueries } from "./roulette.queries";
import { createRouletteIndex, rouletteSchema } from "./roulette.schema";

export * from "./roulette.config";
export * from "./roulette.crud";
export * from "./roulette.errors";
export * from "./roulette.mutations";
export * from "./roulette.queries";
export * from "./roulette.schema";
export * from "./roulette.types";

export class RouletteEntity {
  public static createIndex = createRouletteIndex;
  public static crud = rouletteCrud;
  public static errors = rouletteErrors;
  public static mutations = rouletteMutations;
  public static queries = rouletteQueries;
  public static schema = rouletteSchema;
}
