import {
  BlackjackAction,
  BlackjackGame,
  BlackjackState,
  CannotTakeActionError,
  FinishedBlackjackStatus,
  GameInProgressError,
  NoGameInProgressError,
} from "games";
import { createLogger } from "logger";
import { chargeClient, payClient, postgres } from "persistence";

export interface Blackjack {
  clientId: number;
  active: boolean;
  state: BlackjackState;
  wager: number;
  winnings: number;
  createdAt: string;
  updatedAt: string;
}

export type BlackjackCreate = Pick<Blackjack, "wager" | "state" | "winnings">;

export type BlackjackUpdate = Partial<
  BlackjackCreate & Pick<Blackjack, "active">
>;

export const BLACKJACK_MODEL_LOGGER = createLogger("Blackjack Model");

// #region Tables
export const BLACKJACK_TABLE_NAME = "blackjack";

/* istanbul ignore next */
export async function createBlackjackTable() {
  const exists = await postgres.schema.hasTable(BLACKJACK_TABLE_NAME);

  if (exists) {
    BLACKJACK_MODEL_LOGGER.info(
      { table: BLACKJACK_TABLE_NAME },
      "Table exists."
    );
  } else {
    BLACKJACK_MODEL_LOGGER.info(
      { table: BLACKJACK_TABLE_NAME },
      "Creating table."
    );

    return postgres.schema.createTable(BLACKJACK_TABLE_NAME, (table) => {
      table.increments("id", { primaryKey: true });
      table
        .integer("clientId")
        .references("clients.id")
        .notNullable()
        .onDelete("CASCADE");
      table.boolean("active").defaultTo(true).notNullable();
      table.jsonb("state");
      table.integer("wager").defaultTo(0).notNullable();
      table.integer("winnings").defaultTo(0).notNullable();
      table.timestamps(true, true, true);
    });
  }
}

/* istanbul ignore next */
export async function dropBlackjackTable() {
  const exists = await postgres.schema.hasTable(BLACKJACK_TABLE_NAME);

  if (exists) {
    BLACKJACK_MODEL_LOGGER.info(
      { table: BLACKJACK_TABLE_NAME },
      "Dropping table."
    );

    return postgres.schema.dropTable(BLACKJACK_TABLE_NAME);
  } else {
    BLACKJACK_MODEL_LOGGER.info(
      { table: BLACKJACK_TABLE_NAME },
      "Table does not exist."
    );
  }
}
// #endregion

// #region CRUD
export async function createBlackjackGame(
  clientId: number,
  { wager, state, winnings }: BlackjackCreate
) {
  try {
    const [game] = await postgres<Blackjack>(BLACKJACK_TABLE_NAME)
      .insert({
        clientId,
        wager,
        state,
        winnings,
      })
      .returning("*");

    /* istanbul ignore if */
    if (!game) {
      throw new Error();
    }

    return game;
  } catch (error) {
    /* istanbul ignore next */
    return null;
  }
}

export async function readBlackjackGame(gameId: number) {
  try {
    const game = await postgres<Blackjack>(BLACKJACK_TABLE_NAME)
      .where("id", gameId)
      .first();

    if (!game) {
      throw new Error();
    }

    return game;
  } catch (error) {
    return null;
  }
}

export async function readActiveBlackjackGame(clientId: number) {
  try {
    const [blackjack] = await postgres<Blackjack>(BLACKJACK_TABLE_NAME)
      .where("clientId", clientId)
      .where("active", true);

    return blackjack ?? null;
  } catch (error) {
    return null;
  }
}

export function updateBlackjackGame(
  clientId: number,
  gameData: Partial<Blackjack>
) {
  return postgres<Blackjack>(BLACKJACK_TABLE_NAME)
    .where("clientId", clientId)
    .where("active", true)
    .update(gameData);
}
// #endregion

export async function startBlackjackGame(clientId: number, wager: number) {
  const { data: activeGame } = await getClientBlackjackGame(clientId);

  if (activeGame) {
    throw new GameInProgressError();
  }

  const charged = await chargeClient(clientId, wager, "Blackjack");

  if (!charged) {
    throw new CannotAffordWagerError();
  }

  try {
    const game = new BlackjackGame();

    game.deal();

    const blackjack = await createBlackjackGame(clientId, {
      wager,
      state: game.serialize(),
      winnings: 0,
    });

    return blackjack;
  } catch (error) {
    BLACKJACK_MODEL_LOGGER.error(
      { error },
      "Unable to start a blackjack game. Refunding client."
    );

    await payClient(clientId, wager);

    throw error;
  }
}

export async function takeBlackjackAction(
  clientId: number,
  action: BlackjackAction
) {
  const { data, game } = await getClientBlackjackGame(clientId);

  if (!(data && game)) {
    throw new NoGameInProgressError();
  }

  switch (action) {
    case "deal":
      throw new GameInProgressError();
    case "hit":
      game.hit();
      break;
    case "stay":
      game.stay();
      break;
    case "double-down": {
      if (!game.playerCanDoubleDown) {
        throw new CannotTakeActionError();
      }

      const charged = await chargeClient(
        clientId,
        data.wager,
        "Blackjack, double down"
      );

      if (!charged) {
        throw new CannotTakeActionError();
      }

      game.doubleDown();
      break;
    }
    case "buy-insurance": {
      if (!game.playerCanPurchaseInsurance) {
        throw new CannotTakeActionError();
      }

      const price = Math.floor(data.wager / 2);
      const charged = await chargeClient(
        clientId,
        price,
        "Blackjack, buy insurance"
      );

      if (!charged) {
        throw new CannotTakeActionError();
      }

      game.buyInsurance();

      break;
    }
  }

  data.state = game.serialize();

  if (game.status !== "playing") {
    await payoutBlackjackGame(data);
  }

  data.state = game.serialize();

  await updateBlackjackGame(clientId, data);

  return data;
}

export async function getClientBlackjackGame(clientId: number) {
  const data = await readActiveBlackjackGame(clientId);

  return {
    data,
    game: data ? new BlackjackGame().deserialize(data.state) : null,
  };
}

export async function payoutBlackjackGame(gameData: Blackjack) {
  if (!gameData.active) {
    throw new CannotPayoutError();
  }

  const game = new BlackjackGame();

  game.deserialize(gameData.state);

  let payout = 0;

  const handlers: Record<FinishedBlackjackStatus, () => void> = {
    lost: () => {
      if (game.insuranceApplies && game.playerBoughtInsurance) {
        gameData.winnings = 0;
        payout = gameData.wager;
      } else {
        gameData.winnings = -gameData.wager;
        payout = 0;
      }
    },
    pushed: () => {
      gameData.winnings = 0;
      payout = gameData.wager;
    },
    won: () => {
      gameData.winnings = gameData.wager;
      payout = gameData.wager * 2;
    },
    blackjack: () => {
      gameData.winnings = Math.floor((gameData.wager * 3) / 2);
      payout = gameData.wager + gameData.winnings;
    },
  };
  const handler =
    handlers[gameData.state.status as FinishedBlackjackStatus] ??
    (() => {
      throw new CannotPayoutError();
    });

  handler();

  if (payout > 0) {
    await payClient(gameData.clientId, payout, "Blackjack, payout");
  }

  gameData.active = false;

  await updateBlackjackGame(gameData.clientId, gameData);

  return gameData;
}

export class CannotAffordWagerError extends Error {}
export class CannotPayoutError extends Error {}
