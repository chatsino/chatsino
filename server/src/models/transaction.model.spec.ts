import Chance from "chance";
import { initializeCache, initializeDatabase } from "persistence";
import { Client, createClient } from "./client.model";
import {
  createTransaction,
  deleteAllTransactions,
  readTransaction,
  readTransactionList,
  Transaction,
} from "./transaction.model";

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

  describe("CRUD", () => {
    describe(createTransaction.name, () => {
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

    describe(readTransaction.name, () => {
      it("should retrieve a transaction", async () => {
        const transaction = (await createTransaction(
          clientA.id,
          clientB.id,
          500
        )) as Transaction;
        const retrievedTransaction = await readTransaction(transaction.id);

        expect(retrievedTransaction).toEqual(transaction);
      });

      it("should gracefully fail trying to retrieve a non-existent transaction", async () => {
        const retrievedTransaction = await readTransaction(666666);

        expect(retrievedTransaction).toBeNull();
      });
    });

    describe(readTransactionList.name, () => {
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
        const transactions = await readTransactionList();

        expect(transactions).toEqual([transactionA, transactionB]);
      });

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
        const transactions = await readTransactionList({ memo });

        expect(transactions).toEqual([transactionB]);
      });

      it("should retrieve all transactions sent by a specified client", async () => {
        const amount = 500;
        const transactionA = await createTransaction(
          clientA.id,
          clientB.id,
          amount
        );

        await createTransaction(clientB.id, clientA.id, amount);

        const transactions = await readTransactionList({ from: clientA.id });

        expect(transactions).toEqual([transactionA]);
      });

      it("should retrieve all transactions sent to a specified client", async () => {
        const amount = 500;

        await createTransaction(clientA.id, clientB.id, amount);

        const transactionB = await createTransaction(
          clientB.id,
          clientA.id,
          amount
        );
        const transactions = await readTransactionList({ to: clientA.id });

        expect(transactions).toEqual([transactionB]);
      });
    });

    describe(deleteAllTransactions.name, () => {
      it("should remove all transaction records", async () => {
        const amount = 500;
        const transactionA = await createTransaction(
          clientA.id,
          clientB.id,
          amount
        );
        const transactions = await readTransactionList();

        expect(transactions).toEqual([transactionA]);

        const deletedTransactions = await deleteAllTransactions();

        expect(deletedTransactions).toEqual([transactionA]);

        const remainingTransactions = await readTransactionList();

        expect(remainingTransactions).toEqual([]);
      });
    });
  });
});
