import { createLogger } from "logger";
import { postgres } from "persistence";

export interface Chatroom {
  id: number;
  avatar: string;
  title: string;
  description: string;
  password?: string;
  blacklist?: Record<number, true>;
  whitelist?: Record<number, true>;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export const CHATROOM_MODEL_LOGGER = createLogger("Chatroom Model");

export const CHATROOM_TABLE_NAME = "chatrooms";

export async function createChatroomTable() {
  const exists = await postgres.schema.hasTable(CHATROOM_TABLE_NAME);

  if (exists) {
    CHATROOM_MODEL_LOGGER.info({ table: CHATROOM_TABLE_NAME }, "Table exists.");
  } else {
    CHATROOM_MODEL_LOGGER.info(
      { table: CHATROOM_TABLE_NAME },
      "Creating table."
    );

    return postgres.schema.createTable(CHATROOM_TABLE_NAME, (table) => {
      table.increments("id", { primaryKey: true });
      table.string("avatar").notNullable();
      table.string("title").notNullable();
      table.string("description").notNullable();
      table.string("password").nullable();
      table.jsonb("blacklist").nullable();
      table.jsonb("whitelist").nullable();
      table
        .integer("createdBy")
        .notNullable()
        .references("clients.id")
        .onDelete("SET NULL");
      table
        .integer("updatedBy")
        .notNullable()
        .references("clients.id")
        .onDelete("SET NULL");
      table.timestamps(true, true, true);
    });
  }
}

export async function dropChatroomTable() {
  const exists = await postgres.schema.hasTable(CHATROOM_TABLE_NAME);

  if (exists) {
    CHATROOM_MODEL_LOGGER.info(
      { table: CHATROOM_TABLE_NAME },
      "Dropping table."
    );

    return postgres.schema.dropTable(CHATROOM_TABLE_NAME);
  } else {
    CHATROOM_MODEL_LOGGER.info(
      { table: CHATROOM_TABLE_NAME },
      "Table does not exist."
    );
  }
}
