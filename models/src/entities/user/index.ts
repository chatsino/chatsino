import { userCrud } from "./user.crud";
import { userErrors } from "./user.errors";
import { userMutations } from "./user.mutations";
import { userQueries } from "./user.queries";
import { createUserIndex, userSchema } from "./user.schema";

export * from "./user.config";
export * from "./user.crud";
export * from "./user.errors";
export * from "./user.mutations";
export * from "./user.queries";
export * from "./user.schema";
export * from "./user.types";

export class UserEntity {
  public static createIndex = createUserIndex;
  public static crud = userCrud;
  public static errors = userErrors;
  public static mutations = userMutations;
  public static schema = userSchema;
  public static queries = userQueries;
}
