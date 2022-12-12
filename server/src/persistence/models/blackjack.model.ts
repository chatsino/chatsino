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

export const BLACKJACK_MODEL_LOGGER = createLogger("Blackjack Model");

export const BLACKJACK_TABLE_NAME = "blackjack";

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

export async function startBlackjackGame(clientId: number, wager: number) {
  const { data: activeGame } = await getClientBlackjackGame(clientId);

  if (activeGame) {
    throw new GameInProgressError();
  }

  const charged = await chargeClient(clientId, wager);

  if (!charged) {
    throw new CannotAffordWagerError();
  }

  try {
    const game = new BlackjackGame();
    game.deal();

    await postgres<Blackjack>(BLACKJACK_TABLE_NAME).insert({
      clientId,
      wager,
      state: game.serialize(),
      winnings: 0,
    });

    return getClientBlackjackGame(clientId);
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

      const charged = await chargeClient(clientId, data.wager);

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
      const charged = await chargeClient(clientId, price);

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

  await updateClientBlackjackGame(clientId, data);

  return data;
}

export async function getClientBlackjackGame(clientId: number) {
  const data =
    (await postgres<Blackjack>(BLACKJACK_TABLE_NAME)
      .where("clientId", clientId)
      .where("active", true)
      .first()) ?? null;

  return {
    data,
    game: data ? new BlackjackGame().deserialize(data.state) : null,
  };
}

export function updateClientBlackjackGame(
  clientId: number,
  gameData: Partial<Blackjack>
) {
  return postgres<Blackjack>(BLACKJACK_TABLE_NAME)
    .where("clientId", clientId)
    .where("active", true)
    .update(gameData);
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
    await payClient(gameData.clientId, payout);
  }

  gameData.active = false;

  await updateClientBlackjackGame(gameData.clientId, gameData);

  return gameData;
}

export class CannotAffordWagerError extends Error {}
export class CannotPayoutError extends Error {}
