import * as config from "config";
import knex from "knex";

export const postgres = knex({
  client: "pg",
  connection: config.POSTGRES_CONNECTION_STRING,
  searchPath: ["knex", "public"],
});
