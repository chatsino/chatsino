import { createLogger } from "logger";
import { postgres } from "persistence";

export interface ChatMessage {
  id: number;
  clientId: number;
  chatroomId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const CHAT_MESSAGE_MODEL_LOGGER = createLogger("Chat Message Model");

export const CHAT_MESSAGE_TABLE_NAME = "chat_messages";

export async function createChatMessageTable() {
  const exists = await postgres.schema.hasTable(CHAT_MESSAGE_TABLE_NAME);

  if (exists) {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Table exists."
    );
  } else {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Creating table."
    );

    return postgres.schema.createTable(CHAT_MESSAGE_TABLE_NAME, (table) => {
      table.increments("id", { primaryKey: true });
      table
        .integer("clientId")
        .references("clients.id")
        .notNullable()
        .onDelete("CASCADE");
      table
        .integer("chatroomId")
        .references("chatrooms.id")
        .notNullable()
        .onDelete("CASCADE");
      table.string("content").notNullable().defaultTo("");
      table.timestamps(true, true, true);
    });
  }
}

export async function dropChatMessageTable() {
  const exists = await postgres.schema.hasTable(CHAT_MESSAGE_TABLE_NAME);

  if (exists) {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Dropping table."
    );

    return postgres.schema.dropTable(CHAT_MESSAGE_TABLE_NAME);
  } else {
    CHAT_MESSAGE_MODEL_LOGGER.info(
      { table: CHAT_MESSAGE_TABLE_NAME },
      "Table does not exist."
    );
  }
}
