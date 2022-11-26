import Chance from "chance";
import type { Client, SafeClient } from "models";

const CHANCE = new Chance();

export class TestGenerator {
  public static createClient(overrides: Partial<Client> = {}): Client {
    return {
      id: CHANCE.integer(),
      username: CHANCE.name(),
      permissionLevel: "admin:unlimited",
      hash: CHANCE.hash(),
      salt: CHANCE.hash(),
      chips: 0,
      createdAt: new Date().toString(),
      updatedAt: new Date().toString(),
      ...overrides,
    };
  }

  public static createSafeClient(overrides: Partial<Client> = {}): SafeClient {
    const {
      hash: _,
      salt: __,
      ...safeClient
    } = TestGenerator.createClient(overrides);
    return safeClient;
  }
}
