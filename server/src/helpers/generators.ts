import Chance from "chance";
import type { FullClient, Client } from "models";

const CHANCE = new Chance();

export class TestGenerator {
  public static createFullClient(
    overrides: Partial<FullClient> = {}
  ): FullClient {
    return {
      id: CHANCE.integer(),
      username: CHANCE.name(),
      avatar: CHANCE.url(),
      permissionLevel: "admin:unlimited",
      hash: CHANCE.hash(),
      salt: CHANCE.hash(),
      chips: 0,
      createdAt: new Date().toString(),
      updatedAt: new Date().toString(),
      ...overrides,
    };
  }

  public static createClient(overrides: Partial<FullClient> = {}): Client {
    const {
      hash: _,
      salt: __,
      ...safeClient
    } = TestGenerator.createFullClient(overrides);
    return safeClient;
  }
}
