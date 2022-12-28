import { userCrud } from "./user.crud";
import { userMutations } from "./user.mutations";
import { userQueries } from "./user.queries";
import { createUserIndex, userSchema } from "./user.schema";

export * from "./user.schema";
export * from "./user.types";

export class UserEntity {
  public static createIndex = createUserIndex;
  public static crud = userCrud;
  public static schema = userSchema;
  public static queries = userQueries;
  public static mutations = userMutations;
}
