export type RouletteStatus =
  | "taking-bets"
  | "no-more-bets"
  | "spinning"
  | "waiting"
  | "finished";

export type RouletteBetKind =
  | "straight-up"
  | "line"
  | "column"
  | "dozen"
  | "even-odd"
  | "red-black"
  | "high-low";

export type RouletteStraightUpBetWhich = number;
export type RouletteLineBetWhich = 1 | 2 | 3 | 4 | 5 | 6;
export type RouletteColumnBetWhich = 1 | 2 | 3;
export type RouletteDozenBetWhich = 1 | 2 | 3;
export type RouletteEvenOddBetWhich = "even" | "odd";
export type RouletteRedBlackBetWhich = "red" | "black";
export type RouletteHighLowBetWhich = "high" | "low";

export type RouletteBetWhich =
  | RouletteStraightUpBetWhich
  | RouletteLineBetWhich
  | RouletteColumnBetWhich
  | RouletteDozenBetWhich
  | RouletteEvenOddBetWhich
  | RouletteRedBlackBetWhich
  | RouletteHighLowBetWhich;

export type RouletteBetTemplate<
  K extends RouletteBetKind,
  W extends RouletteBetWhich
> = {
  kind: K;
  which: W;
};

export type RouletteStraightUpBet = RouletteBetTemplate<
  "straight-up",
  RouletteStraightUpBetWhich
>;
export type RouletteLineBet = RouletteBetTemplate<"line", RouletteLineBetWhich>;
export type RouletteColumnBet = RouletteBetTemplate<
  "column",
  RouletteColumnBetWhich
>;
export type RouletteDozenBet = RouletteBetTemplate<
  "dozen",
  RouletteDozenBetWhich
>;
export type RouletteEvenOddBet = RouletteBetTemplate<
  "even-odd",
  RouletteEvenOddBetWhich
>;
export type RouletteRedBlackBet = RouletteBetTemplate<
  "red-black",
  RouletteRedBlackBetWhich
>;
export type RouletteHighLowBet = RouletteBetTemplate<
  "high-low",
  RouletteHighLowBetWhich
>;

export type RouletteBet =
  | RouletteStraightUpBet
  | RouletteLineBet
  | RouletteColumnBet
  | RouletteDozenBet
  | RouletteEvenOddBet
  | RouletteRedBlackBet
  | RouletteHighLowBet;

export type UserRouletteBet = RouletteBet & {
  userId: string;
  wager: number;
};

export type DeterminedUserRouletteBet = UserRouletteBet & {
  reward: number;
};
