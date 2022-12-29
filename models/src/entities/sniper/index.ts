import { sniperCrud } from "./sniper.crud";
import { sniperErrors } from "./sniper.errors";
import { sniperMutations } from "./sniper.mutations";
import { sniperQueries } from "./sniper.queries";
import { createSniperIndex, sniperSchema } from "./sniper.schema";

export * from "./sniper.config";
export * from "./sniper.crud";
export * from "./sniper.errors";
export * from "./sniper.mutations";
export * from "./sniper.queries";
export * from "./sniper.schema";
export * from "./sniper.types";

export class SniperEntity {
  public static createIndex = createSniperIndex;
  public static crud = sniperCrud;
  public static errors = sniperErrors;
  public static schema = sniperSchema;
  public static queries = sniperQueries;
  public static mutations = sniperMutations;
}
