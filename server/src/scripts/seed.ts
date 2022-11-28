import { createClient, createClientTable, dropClientTable } from "models";
import { initializeRedis } from "persistence";

const DEFAULT_PASSWORD = "password";

export async function seed() {
  await initializeRedis();
  await dropClientTable();
  await createClientTable();
  await createClient("admin", DEFAULT_PASSWORD, "admin:unlimited");
  await createClient("admin2", DEFAULT_PASSWORD, "admin:limited");

  process.exit(0);
}