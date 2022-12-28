import { executeCommand } from "object-mapper";
import { Client, Entity, Schema } from "redis-om";
import { SNIPER_SKIM } from "./sniper.config";
import { Snipe, SniperStatus } from "./sniper.types";

export interface Sniper {
  id: string;
  startedAt: string;
  status: SniperStatus;
  snipes: string[];
  participants: string[];
  pot: number;
  winner: string;
}

export class Sniper extends Entity {
  public static serializeSnipe(snipe: Snipe) {
    const { userId, wager, shotAt } = snipe;
    return [userId, wager, shotAt].join("/");
  }

  public static deserializeSnipe(snipeString: string) {
    const [userId, wager, shotAt] = snipeString.split("/") as [
      string,
      string,
      string
    ];
    return { userId, wager: parseInt(wager), shotAt };
  }

  public get fields() {
    return {
      id: this.id,
      startedAt: this.startedAt,
      status: this.status,
      snipes: this.snipes,
      participants: this.participants,
      pot: this.pot,
      winner: this.winner,
    };
  }

  public shoot(userId: string, wager: number) {
    if (!this.participants.includes(userId)) {
      this.participants.push(userId);
    }

    this.pot += wager;

    this.snipes.push(
      Sniper.serializeSnipe({ userId, wager, shotAt: new Date().toString() })
    );
  }

  public finish() {
    this.status = "closed";
    this.determineResults();
  }

  public getAmountOwedTo(userId: string) {
    if (!this.winner) {
      return 0;
    }

    const winningShot = Sniper.deserializeSnipe(this.winner);

    if (winningShot.userId !== userId) {
      return 0;
    }

    return Math.floor(this.pot * (1.0 - SNIPER_SKIM));
  }

  private determineResults() {
    if (this.snipes.length < 2) {
      return;
    }

    this.winner = [...this.snipes]
      .sort((a, b) => {
        const aSnipe = Sniper.deserializeSnipe(a);
        const bSnipe = Sniper.deserializeSnipe(b);

        return aSnipe.wager - bSnipe.wager;
      })
      .pop()!;
  }
}

export const sniperSchema = new Schema(Sniper, {
  id: {
    type: "string",
  },
  startedAt: {
    type: "date",
  },
  status: {
    type: "string",
  },
  snipes: {
    type: "string[]",
  },
  participants: {
    type: "string[]",
  },
  pot: {
    type: "number",
  },
  winner: {
    type: "string",
  },
});

export const createSniperRepository = (client: Client) =>
  client.fetchRepository(sniperSchema);

export const createSniperIndex = () =>
  executeCommand((client) => createSniperRepository(client).createIndex());
