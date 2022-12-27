import { Chance } from "chance";
import { initializeCache, REDIS } from "persistence";
import { createRouletteIndex } from "./roulette.schema";
import { rouletteMutations } from "./roulette.mutations";
import { User, UserEntity } from "../user.entity";

jest.setTimeout(25000);

const CHANCE = new Chance();

describe("Roulette Mutations", () => {
  let userA: User;

  beforeEach(async () => {
    await initializeCache();
    await REDIS.flushAll();
    await Promise.all([UserEntity.createIndex(), createRouletteIndex()]);

    userA = await UserEntity.mutations.createUser({
      avatar: CHANCE.avatar(),
      username: "admin",
    });

    await UserEntity.mutations.payUser(userA.id, 20000);
  });
  describe(rouletteMutations.startGame.name, () => {
    it("should start a new roulette game and run through to completion", async () => {
      setTimeout(() => {
        rouletteMutations.takeBet({
          userId: userA.id,
          wager: 100,
          kind: "straight-up",
          which: 12,
        });
      }, 100);

      await rouletteMutations.startGame();

      expect(true).toBe(true);
    });
  });
});
