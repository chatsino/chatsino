import Chance from "chance";
import { initializeCache } from "../cache";
import { initializeDatabase } from "../database";
import {
  createTransaction,
  deleteAllTransactions,
  getAllTransactions,
  getAllTransactionsWithMemo,
  getTransactionsSentByClient,
  getTransactionsSentToClient,
} from "./transaction.model";
import { Client, createClient } from "./client.model";

const CHANCE = new Chance();

describe("Transaction Model", () => {
  let clientA: Client;
  let clientB: Client;

  beforeAll(async () => {
    await initializeDatabase();
    await initializeCache();

    clientA = (await createClient(
      CHANCE.word({ length: 8 }),
      CHANCE.word({ length: 8 })
    )) as Client;

    clientB = (await createClient(
      CHANCE.word({ length: 8 }),
      CHANCE.word({ length: 8 })
    )) as Client;
  });

  beforeEach(async () => {
    await deleteAllTransactions();
  });

  describe("createTransaction()", () => {
    it("should add a new transaction to the table", async () => {
      const amount = 500;
      const transaction = await createTransaction(
        clientA.id,
        clientB.id,
        amount
      );

      expect(transaction).toEqual({
        id: expect.any(Number),
        from: clientA.id,
        to: clientB.id,
        amount,
        memo: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("deleteAllTransactions()", () => {
    it("should remove all transaction records", async () => {
      const amount = 500;
      const transactionA = await createTransaction(
        clientA.id,
        clientB.id,
        amount
      );
      const transactions = await getAllTransactions();

      expect(transactions).toEqual([transactionA]);

      const deletedTransactions = await deleteAllTransactions();

      expect(deletedTransactions).toEqual([transactionA]);

      const remainingTransactions = await getAllTransactions();

      expect(remainingTransactions).toEqual([]);
    });
  });

  describe("getAllTransactions()", () => {
    it("should retrieve a collection of all transactions", async () => {
      const amount = 500;
      const transactionA = await createTransaction(
        clientA.id,
        clientB.id,
        amount
      );
      const transactionB = await createTransaction(
        clientB.id,
        clientA.id,
        amount
      );
      const transactions = await getAllTransactions();

      expect(transactions).toEqual([transactionA, transactionB]);
    });
  });

  describe("getAllTransactionsWithMemo()", () => {
    it("should retrieve all transactions matching the specified memo", async () => {
      const amount = 500;
      const memo = "Award";

      await createTransaction(clientA.id, clientB.id, amount);

      const transactionB = await createTransaction(
        clientB.id,
        clientA.id,
        amount,
        memo
      );
      const transactions = await getAllTransactionsWithMemo(memo);

      expect(transactions).toEqual([transactionB]);
    });
  });

  describe("getTransactionsSentByClient()", () => {
    it("should retrieve all transactions sent by a specified client", async () => {
      const amount = 500;
      const transactionA = await createTransaction(
        clientA.id,
        clientB.id,
        amount
      );

      await createTransaction(clientB.id, clientA.id, amount);

      const transactions = await getTransactionsSentByClient(clientA.id);

      expect(transactions).toEqual([transactionA]);
    });
  });

  describe("getTransactionsSentToClient()", () => {
    it("should retrieve all transactions sent to a specified client", async () => {
      const amount = 500;

      await createTransaction(clientA.id, clientB.id, amount);

      const transactionB = await createTransaction(
        clientB.id,
        clientA.id,
        amount
      );
      const transactions = await getTransactionsSentToClient(clientA.id);

      expect(transactions).toEqual([transactionB]);
    });
  });
});
