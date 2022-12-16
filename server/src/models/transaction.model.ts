import { createLogger } from "logger";
import { postgres } from "persistence";

export interface Transaction {
  id: number;
  from: null | number;
  to: null | number;
  amount: number;
  memo: null | string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionListRead = Partial<
  Pick<Transaction, "from" | "to" | "memo">
>;

export const TRANSACTION_MODEL_LOGGER = createLogger("Transaction Model");

// #region Table
export const TRANSACTION_TABLE_NAME = "transactions";

/* istanbul ignore next */
export async function createTransactionTable() {
  const exists = await postgres.schema.hasTable(TRANSACTION_TABLE_NAME);

  if (exists) {
    TRANSACTION_MODEL_LOGGER.info(
      { table: TRANSACTION_TABLE_NAME },
      "Table exists."
    );
  } else {
    TRANSACTION_MODEL_LOGGER.info(
      { table: TRANSACTION_TABLE_NAME },
      "Creating table."
    );

    return postgres.schema.createTable(TRANSACTION_TABLE_NAME, (table) => {
      table.increments("id", { primaryKey: true });
      table.integer("from").references("clients.id").nullable();
      table.integer("to").references("clients.id").notNullable();
      table.integer("amount").notNullable().checkPositive();
      table.string("memo").nullable();
      table.timestamps(true, true, true);
    });
  }
}

/* istanbul ignore next */
export async function dropTransactionTable() {
  const exists = await postgres.schema.hasTable(TRANSACTION_TABLE_NAME);

  if (exists) {
    TRANSACTION_MODEL_LOGGER.info(
      { table: TRANSACTION_TABLE_NAME },
      "Dropping table."
    );

    return postgres.schema.dropTable(TRANSACTION_TABLE_NAME);
  } else {
    TRANSACTION_MODEL_LOGGER.info(
      { table: TRANSACTION_TABLE_NAME },
      "Table does not exist."
    );
  }
}
// #endregion

// #region CRUD
export async function createTransaction<
  T extends null | number,
  K extends null | number
>(from: T, to: K, amount: number, memo?: string) {
  try {
    const [transaction] = await postgres<Transaction>(TRANSACTION_TABLE_NAME)
      .insert({
        from,
        to,
        amount,
        memo,
      })
      .returning("*");

    /* istanbul ignore if */
    if (!transaction) {
      throw new Error();
    }

    return transaction;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function readTransaction(transactionId: number) {
  try {
    const transaction = await postgres<Transaction>(TRANSACTION_TABLE_NAME)
      .where("id", transactionId)
      .first();

    if (!transaction) {
      throw new Error();
    }

    return transaction;
  } catch (error) {
    return null;
  }
}

export async function readTransactionList(options: TransactionListRead = {}) {
  try {
    let transactions: Transaction[] = [];

    if (options.from) {
      transactions = await postgres<Transaction>(TRANSACTION_TABLE_NAME).where(
        "from",
        options.from
      );
    } else if (options.to) {
      transactions = await postgres<Transaction>(TRANSACTION_TABLE_NAME).where(
        "to",
        options.to
      );
    } else if (options.memo) {
      transactions = await postgres<Transaction>(TRANSACTION_TABLE_NAME).where(
        "memo",
        options.memo
      );
    } else {
      transactions = await postgres<Transaction>(
        TRANSACTION_TABLE_NAME
      ).select();
    }

    return transactions;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function deleteAllTransactions() {
  try {
    const transactions = await postgres<Transaction>(TRANSACTION_TABLE_NAME)
      .delete()
      .returning("*");

    return transactions;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}
// #endregion
