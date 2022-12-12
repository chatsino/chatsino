import {
  createClient,
  createClientTable,
  dropClientTable,
  createBlackjackTable,
  dropBlackjackTable,
  createChatroomTable,
  dropChatroomTable,
  createChatMessageTable,
  dropChatMessageTable,
  createTransactionTable,
  dropTransactionTable,
} from "persistence";
import { initializeCache } from "persistence";

const DEFAULT_PASSWORD = "password";

export async function seed() {
  await initializeCache();

  await dropBlackjackTable();
  await dropChatMessageTable();
  await dropChatroomTable();
  await dropTransactionTable();
  await dropClientTable();

  await createClientTable();
  await createTransactionTable();
  await createChatroomTable();
  await createChatMessageTable();
  await createBlackjackTable();

  await createClient("admin", DEFAULT_PASSWORD, "admin:unlimited");
  await createClient("admin2", DEFAULT_PASSWORD, "admin:limited");

  process.exit(0);
}
