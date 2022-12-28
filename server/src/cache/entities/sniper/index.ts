import { sniperCrud } from "./sniper.crud";
import { createSniperIndex, sniperSchema } from "./sniper.schema";
import { sniperQueries } from "./sniper.queries";
import { sniperMutations } from "./sniper.mutations";

export * from "./sniper.config";
export * from "./sniper.schema";
export * from "./sniper.types";

export class SniperEntity {
  public static createIndex = createSniperIndex;
  public static crud = sniperCrud;
  public static schema = sniperSchema;
  public static queries = sniperQueries;
  public static mutations = sniperMutations;
}
