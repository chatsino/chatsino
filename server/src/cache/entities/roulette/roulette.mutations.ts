import * as config from "config";
import { createLogger } from "logger";
import { createClient } from "redis";
import { UserEntity } from "../user.entity";
import {
  NO_MORE_BETS_DURATION,
  SPINNING_DURATION,
  TAKING_BETS_DURATION,
  TIME_BETWEEN_GAMES,
} from "./roulette.config";
import { rouletteCrud } from "./roulette.crud";
import { rouletteQueries } from "./roulette.queries";
import { Roulette } from "./roulette.schema";
import {
  RouletteCannotFinishError,
  RouletteNoGameInProgressError,
  UserRouletteBet,
} from "./roulette.types";

const ROULETTE_MUTATIONS_LOGGER = createLogger("Roulette Mutations");

export const rouletteMutations = {
  startGame: async () => {
    ROULETTE_MUTATIONS_LOGGER.info("Starting Roulette.");

    let game = await rouletteQueries.activeGame();

    if (!game) {
      ROULETTE_MUTATIONS_LOGGER.info("No game in progress -- starting one.");

      game = await rouletteCrud.create();
    }

    let activeGame = game as Roulette;
    const updateGame = () => rouletteCrud.update(activeGame.id, activeGame);
    const client = createClient({ url: config.REDIS_CONNECTION_STRING });
    const subscriber = client.duplicate();

    await client.connect();
    await subscriber.connect();
    await client.configSet("notify-keyspace-events", "Ex");

    const waitForExpiration = async (
      expiredKey: string,
      expiresAt: number,
      shouldSet: boolean
    ) => {
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
    };

    while (activeGame.status !== "finished") {
      switch (activeGame.status) {
        case "taking-bets": {
          ROULETTE_MUTATIONS_LOGGER.info("Taking bets.");

          const key = `${activeGame.id}@taking-bets`;

          await waitForExpiration(
            key,
            TAKING_BETS_DURATION,
            !Boolean(await client.get(key))
          );

          activeGame.stopTakingBets();
          activeGame = await updateGame();

          continue;
        }
        case "no-more-bets": {
          ROULETTE_MUTATIONS_LOGGER.info("No more bets.");

          const key = `${activeGame.id}@no-more-bets`;

          await waitForExpiration(
            key,
            NO_MORE_BETS_DURATION,
            !Boolean(await client.get(key))
          );

          activeGame.spin();
          activeGame = await updateGame();

          continue;
        }
        case "spinning": {
          ROULETTE_MUTATIONS_LOGGER.info("Spinning...");

          const key = `${activeGame.id}@spinning`;

          await waitForExpiration(
            key,
            SPINNING_DURATION,
            !Boolean(await client.get(key))
          );

          activeGame.stopSpinning();
          activeGame = await updateGame();

          continue;
        }
        case "waiting": {
          ROULETTE_MUTATIONS_LOGGER.info(
            { outcome: activeGame.outcome },
            "Spin completed."
          );

          const key = `${game.id}@waiting`;

          await waitForExpiration(
            key,
            TIME_BETWEEN_GAMES,
            !Boolean(await client.get(key))
          );

          ROULETTE_MUTATIONS_LOGGER.info(
            { outcome: activeGame.outcome },
            "Paying out."
          );

          await rouletteMutations.payout();

          activeGame.finish();
          activeGame = await updateGame();

          continue;
        }
      }
    }

    ROULETTE_MUTATIONS_LOGGER.info(
      { outcome: activeGame.outcome },
      "Game complete."
    );

    return activeGame;
  },
  takeBet: async (bet: UserRouletteBet) => {
    const game = await rouletteQueries.activeGame();

    if (!game) {
      throw new RouletteNoGameInProgressError();
    }

    await UserEntity.mutations.chargeUser(bet.userId, bet.wager);

    game.takeBet(bet);

    return rouletteCrud.update(game.id, game);
  },
  payout: async () => {
    const game = await rouletteQueries.activeGame();

    if (!game) {
      throw new RouletteNoGameInProgressError();
    }

    if (game.status !== "waiting") {
      throw new RouletteCannotFinishError();
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
