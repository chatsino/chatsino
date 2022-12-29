import { messageCrud } from "./message.crud";
import { messageErrors } from "./message.errors";
import { messageMutations } from "./message.mutations";
import { messageQueries } from "./message.queries";
import { createMessageIndex, messageSchema } from "./message.schema";

export * from "./message.crud";
export * from "./message.errors";
export * from "./message.mutations";
export * from "./message.queries";
export * from "./message.schema";
export * from "./message.types";

export class MessageEntity {
  public static createIndex = createMessageIndex;
  public static crud = messageCrud;
  public static errors = messageErrors;
  public static mutations = messageMutations;
  public static queries = messageQueries;
  public static schema = messageSchema;
}
