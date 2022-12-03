import {
  createClient,
  createClientTable,
  dropClientTable,
  createBlackjackTable,
  dropBlackjackTable,
} from "persistence";
import { initializeCache } from "persistence";

const DEFAULT_PASSWORD = "password";

export async function seed() {
  await initializeCache();

  await dropBlackjackTable();
  await dropClientTable();

  await createClientTable();
  await createBlackjackTable();

  await createClient("admin", DEFAULT_PASSWORD, "admin:unlimited");
  await createClient("admin2", DEFAULT_PASSWORD, "admin:limited");

  process.exit(0);
}
