import { messageCrud } from "./message.crud";
import { messageMutations } from "./message.mutations";
import { messageQueries } from "./message.queries";
import { createMessageIndex, messageSchema } from "./message.schema";

export * from "./message.types";

export class MessageEntity {
  public static createIndex = createMessageIndex;
  public static crud = messageCrud;
  public static schema = messageSchema;
  public static queries = messageQueries;
  public static mutations = messageMutations;
}
