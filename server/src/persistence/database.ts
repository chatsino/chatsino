import * as config from "config";
import * as models from "./models";
import knex from "knex";

export const postgres = knex({
  client: "pg",
  connection: config.POSTGRES_CONNECTION_STRING,
  searchPath: ["knex", "public"],
});

export function initializeDatabase() {
  return Promise.all([
    models.createClientTable(),
    models.createChatroomTable(),
    models.createChatMessageTable(),
    models.createTransactionTable(),
    models.createBlackjackTable(),
  ]);
}
