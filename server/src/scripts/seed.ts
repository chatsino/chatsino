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
  createChatroom,
} from "models";
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

  // Users
  const admin = await createClient(
    "admin",
    DEFAULT_PASSWORD,
    "admin:unlimited"
  );

  // Chatrooms
  await createChatroom(admin.id, {
    avatar: "https://placehold.it/32x32",
    title: "Lobby",
    description: "Just an entrance hallway type of place.",
  });

  process.exit(0);
}
