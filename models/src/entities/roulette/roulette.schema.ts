import { randomInteger } from "helpers";
import { executeCommand } from "cache";
import { Client, Entity, Schema } from "redis-om";
import {
  COLUMNS,
  DOZENS,
  LINES,
  PAYOUT_MULTIPLIERS,
  RED_NUMBERS,
} from "./roulette.config";
import {
  DeterminedUserRouletteBet,
  RouletteBet,
  RouletteBetKind,
  RouletteBetWhich,
  RouletteColumnBet,
  RouletteDozenBet,
  RouletteEvenOddBet,
  RouletteEvenOddBetWhich,
  RouletteHighLowBet,
  RouletteHighLowBetWhich,
  RouletteLineBet,
  RouletteRedBlackBet,
  RouletteRedBlackBetWhich,
  RouletteStatus,
  RouletteStraightUpBet,
  UserRouletteBet,
} from "./roulette.types";

export interface Roulette {
  id: string;
  startedAt: string;
  status: RouletteStatus;
  bets: string[];
  results: string[];
  participants: string[];
  outcome: number;
}

export class Roulette extends Entity {
  public static serializeBet(bet: UserRouletteBet) {
    const { kind, which, userId, wager } = bet;
    return [userId, wager, kind, which].join("/");
  }

  public static deserializeBet(betString: string) {
    const [userId, wager, kind, which] = betString.split("/") as [
      string,
      string,
      RouletteBetKind,
      RouletteBetWhich
    ];
    const shouldParse: RouletteBetKind[] = [
      "straight-up",
      "column",
      "line",
      "dozen",
    ];

    return {
      kind,
      which: shouldParse.includes(kind) ? parseInt(which as string) : which,
      userId,
      wager: parseInt(wager),
    } as UserRouletteBet;
  }

  public static serializeDeterminedBet(bet: DeterminedUserRouletteBet) {
    const { kind, which, userId, wager, reward } = bet;
    return [userId, wager, kind, which, reward].join("/");
  }

  public static deserializeDeterminedBet(betString: string) {
    const [userId, wager, kind, which, reward] = betString.split("/") as [
      string,
      string,
      RouletteBetKind,
      RouletteBetWhich,
      string
    ];

    return {
      kind,
      which,
      userId,
      wager: parseInt(wager),
      reward: parseInt(reward),
    } as DeterminedUserRouletteBet;
  }

  public get fields() {
    return {
      id: this.id,
      startedAt: this.startedAt,
      status: this.status,
      bets: this.bets,
      results: this.results,
      outcome: this.outcome,
      participants: this.participants,
    };
  }

  public get betLookup() {
    return this.bets.reduce(
      (prev, next) => {
        const bet = Roulette.deserializeBet(next);
        prev[bet.kind].push(bet);
        return prev;
      },
      {
        "straight-up": [],
        line: [],
        column: [],
        dozen: [],
        "even-odd": [],
        "red-black": [],
        "high-low": [],
      } as Record<RouletteBetKind, UserRouletteBet[]>
    );
  }

  public get resultsLookup() {
    return this.results.reduce((prev, next) => {
      const bet = Roulette.deserializeDeterminedBet(next);

      if (!prev[bet.userId]) {
        prev[bet.userId] = [];
      }

      prev[bet.userId].push(bet);
      return prev;
    }, {} as Record<string, DeterminedUserRouletteBet[]>);
  }

  public getAmountOwedTo(userId: string) {
    const results = this.resultsLookup[userId];

    return results.reduce((prev, next) => {
      const { wager, reward } = next;
      const amount = reward === 0 ? 0 : wager + reward;

      return prev + amount;
    }, 0);
  }

  public takeBet(bet: UserRouletteBet) {
    if (!this.participants.includes(bet.userId)) {
      this.participants.push(bet.userId);
    }

    this.bets.push(Roulette.serializeBet(bet));
  }

  public stopTakingBets() {
    this.status = "no-more-bets";
    this.determineResults();
  }

  public spin() {
    this.status = "spinning";
    this.outcome = randomInteger(0, 37); // 37 === 00
  }

  public stopSpinning() {
    this.status = "waiting";
    this.determineResults();
  }

  public finish() {
    this.status = "finished";
  }

  private determineResults() {
    const checkers: Record<RouletteBetKind, (bet: RouletteBet) => boolean> = {
      "straight-up": this.checkStraightUpBet,
      line: this.checkLineBet,
      column: this.checkColumnBet,
      dozen: this.checkDozenBet,
      "even-odd": this.checkEvenOddBet,
      "red-black": this.checkRedBlackBet,
      "high-low": this.checkHighLowBet,
    };

    this.results = Object.values(this.betLookup).reduce((prev, next) => {
      for (const bet of next) {
        const handler = checkers[bet.kind].bind(this);
        const won = handler(bet);
        const result: DeterminedUserRouletteBet = {
          ...bet,
          reward: won ? bet.wager * PAYOUT_MULTIPLIERS[bet.kind] : 0,
        };

        prev.push(Roulette.serializeDeterminedBet(result));
      }

      return prev;
    }, [] as string[]);
  }

  private checkStraightUpBet(bet: RouletteStraightUpBet) {
    return bet.which === this.outcome;
  }

  private checkLineBet(bet: RouletteLineBet) {
    const whichLine = Object.entries(LINES).reduce((prev, next) => {
      if (prev !== -1) {
        return prev;
      }

      const [line, numbers] = next;

      if (numbers.includes(this.outcome)) {
        return parseInt(line);
      }

      return prev;
    }, -1);

    return bet.which === whichLine;
  }

  private checkColumnBet(bet: RouletteColumnBet) {
    const whichColumn = Object.entries(COLUMNS).reduce((prev, next) => {
      if (prev !== -1) {
        return prev;
      }

      const [column, numbers] = next;

      if (numbers.includes(this.outcome)) {
        return parseInt(column);
      }

      return prev;
    }, -1);

    return bet.which === whichColumn;
  }

  private checkDozenBet(bet: RouletteDozenBet) {
    const whichDozen = Object.entries(DOZENS).reduce((prev, next) => {
      if (prev !== -1) {
        return prev;
      }

      const [dozen, numbers] = next;

      if (numbers.includes(this.outcome)) {
        return parseInt(dozen);
      }

      return prev;
    }, -1);

    return bet.which === whichDozen;
  }

  private checkEvenOddBet(bet: RouletteEvenOddBet) {
    const isEven = this.outcome % 2 === 0;
    const evenOdd: RouletteEvenOddBetWhich = isEven ? "even" : "odd";

    return bet.which === evenOdd;
  }

  private checkRedBlackBet(bet: RouletteRedBlackBet) {
    const isRed = RED_NUMBERS.includes(this.outcome);
    const redBlack: RouletteRedBlackBetWhich = isRed ? "red" : "black";

    return bet.which === redBlack;
  }

  private checkHighLowBet(bet: RouletteHighLowBet) {
    const isHigh = this.outcome > 18;
    const highLow: RouletteHighLowBetWhich = isHigh ? "high" : "low";

    return bet.which === highLow;
  }
}

export const rouletteSchema = new Schema(Roulette, {
  id: {
    type: "string",
  },
  startedAt: {
    type: "date",
  },
  status: {
    type: "string",
  },
  bets: {
    type: "string[]",
  },
  results: {
    type: "string[]",
  },
  participants: {
    type: "string[]",
  },
  outcome: {
    type: "number",
  },
});

export const createRouletteRepository = (client: Client) =>
  client.fetchRepository(rouletteSchema);

export const createRouletteIndex = () =>
  executeCommand((client) => createRouletteRepository(client).createIndex());
