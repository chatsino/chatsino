import { createLogger } from "logger";
import { postgres } from "persistence";

export interface Transaction {
  id: number;
  from: null | number;
  to: number;
  amount: number;
  memo: null | string;
  createdAt: Date;
  updatedAt: Date;
}

export const TRANSACTION_MODEL_LOGGER = createLogger("Transaction Model");

// #region SQL
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

export async function createTransaction(
  from: null | number,
  to: number,
  amount: number,
  memo: null | string = null
) {
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

export async function getAllTransactions() {
  try {
    const transactions = await postgres<Transaction>(
      TRANSACTION_TABLE_NAME
    ).select();

    return transactions;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function getAllTransactionsWithMemo(memo: string) {
  try {
    const transactions = await postgres<Transaction>(
      TRANSACTION_TABLE_NAME
    ).where("memo", memo);

    return transactions;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function getTransactionsSentByClient(clientId: number) {
  try {
    const transactions = await postgres<Transaction>(
      TRANSACTION_TABLE_NAME
    ).where("from", clientId);

    return transactions;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function getTransactionsSentToClient(clientId: number) {
  try {
    const transactions = await postgres<Transaction>(
      TRANSACTION_TABLE_NAME
    ).where("to", clientId);

    return transactions;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}
