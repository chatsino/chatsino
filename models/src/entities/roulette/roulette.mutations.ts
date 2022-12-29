import * as config from "config";
import { createLogger } from "helpers";
import { createClient } from "redis";
import { UserEntity } from "../user";
import { ROULETTE_STAGES } from "./roulette.config";
import { rouletteCrud } from "./roulette.crud";
import { rouletteErrors } from "./roulette.errors";
import { rouletteQueries } from "./roulette.queries";
import { Roulette } from "./roulette.schema";
import { RouletteStatus, UserRouletteBet } from "./roulette.types";

export const ROULETTE_MUTATIONS_LOGGER = createLogger("Roulette Mutations");

export const rouletteMutations = {
  handleGame: /* istanbul ignore next */ async () => {
    ROULETTE_MUTATIONS_LOGGER.info("Starting Roulette.");

    const gameHandler = rouletteMutations.startGame();
    let activeGame = (await gameHandler.next()).value;
    const currentStageIndex = ROULETTE_STAGES.findIndex(
      (each) => each.key === activeGame.status
    );
    const remainingStages = ROULETTE_STAGES.slice(currentStageIndex);

    ROULETTE_MUTATIONS_LOGGER.info(
      { outcome: activeGame.outcome },
      remainingStages.length === ROULETTE_STAGES.length
        ? "No game in progress -- starting one."
        : "Continuing previous game."
    );

    for (const { key, duration } of remainingStages) {
      const log: Record<RouletteStatus, () => void> = {
        "taking-bets": () => ROULETTE_MUTATIONS_LOGGER.info("Taking bets."),
        "no-more-bets": () => ROULETTE_MUTATIONS_LOGGER.info("No more bets."),
        spinning: () => ROULETTE_MUTATIONS_LOGGER.info("Spinning."),
        waiting: () =>
          ROULETTE_MUTATIONS_LOGGER.info(
            { outcome: activeGame.outcome },
            "Spin completed."
          ),
        finished: () =>
          ROULETTE_MUTATIONS_LOGGER.info(
            { outcome: activeGame.outcome },
            "Paying out."
          ),
      };
      log[key]();

      const fullKey = `${activeGame.id}@${key}`;

      await waitForExpiration(fullKey, duration);

      activeGame = (await gameHandler.next()).value;
    }

    ROULETTE_MUTATIONS_LOGGER.info(
      { outcome: activeGame.outcome },
      "Game complete."
    );

    return activeGame;
  },
  startGame: async function* () {
    let game = await rouletteQueries.activeGame();

    if (!game) {
      game = await rouletteCrud.create();
    }

    let activeGame = game as Roulette;
    const refetchGame = () => rouletteCrud.read(activeGame.id);
    const updateGame = () => rouletteCrud.update(activeGame.id, activeGame);

    yield activeGame;

    while (activeGame.status !== "finished") {
      activeGame = await refetchGame();

      switch (activeGame.status) {
        case "taking-bets": {
          activeGame.stopTakingBets();
          activeGame = await updateGame();

          yield activeGame;

          continue;
        }
        case "no-more-bets": {
          activeGame.spin();
          activeGame = await updateGame();

          yield activeGame;

          continue;
        }
        case "spinning": {
          activeGame.stopSpinning();
          activeGame = await updateGame();

          yield activeGame;

          continue;
        }
        case "waiting": {
          await rouletteMutations.payout();

          activeGame.finish();
          activeGame = await updateGame();

          yield activeGame;

          continue;
        }
      }
    }

    return activeGame;
  },
  takeBet: async (bet: UserRouletteBet) => {
    const game = await rouletteQueries.activeGame();

    if (!game) {
      throw new rouletteErrors.NoGameInProgressError();
    }

    if (game.status !== "taking-bets") {
      throw new rouletteErrors.CannotPlaceBetError();
    }

    await UserEntity.mutations.chargeUser(bet.userId, bet.wager);

    game.takeBet(bet);

    return rouletteCrud.update(game.id, game);
  },
  payout: async () => {
    const game = await rouletteQueries.activeGame();

    if (!game) {
      throw new rouletteErrors.NoGameInProgressError();
    }

    if (game.status !== "waiting") {
      throw new rouletteErrors.CannotFinishError();
    }

    await Promise.all(
      game.participants.map(async (participant) => {
        const owed = game.getAmountOwedTo(participant);

        if (owed > 0) {
          await UserEntity.mutations.payUser(participant, owed);
        }
      })
    );
  },
};

/* istanbul ignore next */
async function waitForExpiration(expiredKey: string, expiresAt: number) {
  const client = createClient({ url: config.REDIS_CONNECTION_STRING });
  const subscriber = client.duplicate();

  await client.connect();
  await client.configSet("notify-keyspace-events", "Ex");
  await subscriber.connect();

  const shouldSet = await client.get(expiredKey);

  if (shouldSet) {
    await client.set(expiredKey, "true", {
      EXAT: expiresAt,
    });
  }

  return new Promise<void>((resolve) => {
    const handleExpiration = (key: string) => {
      if (key === expiredKey) {
        subscriber.unsubscribe("__keyevent@0__:expired", handleExpiration);
        resolve();
      }
    };

    subscriber.subscribe("__keyevent@0__:expired", handleExpiration);
  });
}
