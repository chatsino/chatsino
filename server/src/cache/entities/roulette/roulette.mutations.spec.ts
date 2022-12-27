import { Chance } from "chance";
import { initializeCache, REDIS } from "persistence";
import {
  RouletteEntity,
  RouletteCannotFinishError,
  RouletteCannotPlaceBetError,
  RouletteNoGameInProgressError,
  Roulette,
  UserRouletteBet,
} from ".";
import { User, UserEntity } from "../user.entity";

const CHANCE = new Chance();

describe("Roulette Mutations", () => {
  let userA: User;
  let userB: User;

  beforeEach(async () => {
    jest.resetModules();

    await initializeCache();
    await REDIS.flushAll();
    await Promise.all([UserEntity.createIndex(), RouletteEntity.createIndex()]);

    userA = await UserEntity.mutations.createUser({
      avatar: CHANCE.avatar(),
      username: "admin",
    });
    userB = await UserEntity.mutations.createUser({
      avatar: CHANCE.avatar(),
      username: "user",
    });

    await UserEntity.mutations.payUser(userA.id, 20000);
  });
  describe(RouletteEntity.mutations.startGame.name, () => {
    it("should start a new roulette game and run through to completion", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();

      let activeGame: Roulette;

      for (const status of [
        "taking-bets",
        "no-more-bets",
        "spinning",
        "waiting",
        "finished",
      ]) {
        activeGame = (await gameHandler.next()).value;
        expect(activeGame.status).toBe(status);
        expect(activeGame.fields).toEqual({
          id: expect.any(String),
          startedAt: expect.any(Date),
          status: expect.any(String),
          bets: expect.any(Array),
          results: expect.any(Array),
          participants: expect.any(Array),
          outcome: expect.any(Number),
        });
      }

      const { done, value: finalGame } = await gameHandler.next();

      expect(done).toBe(true);
      expect(finalGame.status).toBe("finished");
    });
    it("should load a previous game and continue where it left off", async () => {
      const beforeGameHandler = RouletteEntity.mutations.startGame();
      await beforeGameHandler.next(); // Taking bets
      await beforeGameHandler.next(); // No more bets

      const gameHandler = RouletteEntity.mutations.startGame();
      let activeGame = (await gameHandler.next()).value;

      expect(activeGame.status).toBe("no-more-bets");
    });
  });
  describe(RouletteEntity.mutations.takeBet.name, () => {
    it("should allow a user to place a bet when bets are open", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      let activeGame = (await gameHandler.next()).value;

      expect(activeGame.bets).toHaveLength(0);
      expect(activeGame.participants).toHaveLength(0);

      const bet: UserRouletteBet = {
        userId: userA.id,
        wager: 100,
        kind: "straight-up",
        which: 12,
      };

      await RouletteEntity.mutations.takeBet(bet);

      activeGame = (await gameHandler.next()).value;

      expect(activeGame.bets).toHaveLength(1);
      expect(activeGame.bets).toContain(Roulette.serializeBet(bet));
      expect(activeGame.participants).toHaveLength(1);
      expect(activeGame.participants).toContain(userA.id);
    });
    it("should prevent a user from placing a bet when they cannot afford to do so", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next();

      expect.hasAssertions();

      try {
        await RouletteEntity.mutations.takeBet({
          userId: userB.id,
          wager: 100,
          kind: "straight-up",
          which: 12,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UserEntity.errors.UserCannotAffordError);
      }
    });
    it("should prevent a user from placing a bet when bets are closed", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets
      await gameHandler.next(); // No more bets

      expect.hasAssertions();

      try {
        await RouletteEntity.mutations.takeBet({
          userId: userA.id,
          wager: 100,
          kind: "straight-up",
          which: 12,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RouletteCannotPlaceBetError);
      }
    });
    it("should prevent a user from placing a bet when there is no active game", async () => {
      expect.hasAssertions();

      try {
        await RouletteEntity.mutations.takeBet({
          userId: userA.id,
          wager: 100,
          kind: "straight-up",
          which: 12,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RouletteNoGameInProgressError);
      }
    });
  });
  describe(RouletteEntity.mutations.payout.name, () => {
    it("should provide chips to users who win a straight-up bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const reward = wager * 35;
      const afterPayout = initialChips + reward;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "straight-up",
        which: 12,
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 12;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(12);
      expect(user.chips).toBe(afterPayout);
    });
    it("should provide chips to users who win a line bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const reward = wager * 5;
      const afterPayout = initialChips + reward;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "line",
        which: 5,
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 29;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(29);
      expect(user.chips).toBe(afterPayout);
    });
    it("should provide chips to users who win a column bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const reward = wager * 2;
      const afterPayout = initialChips + reward;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "column",
        which: 2,
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 11;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(11);
      expect(user.chips).toBe(afterPayout);
    });
    it("should provide chips to users who win a dozen bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const reward = wager * 2;
      const afterPayout = initialChips + reward;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "dozen",
        which: 1,
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 4;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(4);
      expect(user.chips).toBe(afterPayout);
    });
    it("should provide chips to users who win an even/odd bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const reward = wager;
      const afterPayout = initialChips + reward;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "even-odd",
        which: "even",
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 22;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(22);
      expect(user.chips).toBe(afterPayout);
    });
    it("should provide chips to users who win a red/black bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const reward = wager;
      const afterPayout = initialChips + reward;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "red-black",
        which: "red",
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 19;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(19);
      expect(user.chips).toBe(afterPayout);
    });
    it("should provide chips to users who win a high/low bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const reward = wager;
      const afterPayout = initialChips + reward;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "high-low",
        which: "high",
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 30;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(30);
      expect(user.chips).toBe(afterPayout);
    });
    it("should provide chips to users who win two or more bets at once", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wagerA = 100;
      const rewardA = wagerA * 35;
      const wagerB = 200;
      const rewardB = wagerB;
      const afterPayout = initialChips + rewardA + rewardB;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager: wagerA,
        kind: "straight-up",
        which: 12,
      });
      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager: wagerB,
        kind: "high-low",
        which: "low",
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 12;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(12);
      expect(user.chips).toBe(afterPayout);
    });
    it("should not provide chips to users who lose a bet", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      const initialChips = 20000;
      const wager = 100;
      const afterPayout = initialChips - wager;

      await RouletteEntity.mutations.takeBet({
        userId: userA.id,
        wager,
        kind: "straight-up",
        which: 12,
      });

      await gameHandler.next(); // No more bets
      let activeGame = (await gameHandler.next()).value; // Spinning

      activeGame.outcome = 14;
      await RouletteEntity.crud.update(activeGame.id, activeGame);

      activeGame = (await gameHandler.next()).value; // Waiting
      await RouletteEntity.mutations.payout();

      const user = await UserEntity.crud.read(userA.id);

      expect(activeGame.outcome).toBe(14);
      expect(user.chips).toBe(afterPayout);
    });
    it("should prevent paying out when there is no game in progress", async () => {
      expect.hasAssertions();

      try {
        await RouletteEntity.mutations.payout();
      } catch (error) {
        expect(error).toBeInstanceOf(RouletteNoGameInProgressError);
      }
    });
    it("should prevent paying out when the game is not waiting", async () => {
      const gameHandler = RouletteEntity.mutations.startGame();
      await gameHandler.next(); // Taking bets

      expect.hasAssertions();

      try {
        await RouletteEntity.mutations.payout();
      } catch (error) {
        expect(error).toBeInstanceOf(RouletteCannotFinishError);
      }
    });
  });
});
