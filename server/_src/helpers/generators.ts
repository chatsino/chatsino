import Chance from "chance";
import type { Client } from "../__src/repositories";
import type { AuthenticatedClient } from "../__src/services";

const chance = new Chance();

export class TestGenerator {
  public static createClient(overrides: Partial<Client> = {}): Client {
    return {
      id: chance.integer(),
      username: chance.name(),
      permissionLevel: "admin:unlimited",
      hash: chance.hash(),
      salt: chance.hash(),
      chips: 0,
      ...overrides,
    };
  }

  public static createAuthenticatedClient(
    overrides: Partial<AuthenticatedClient> = {}
  ): AuthenticatedClient {
    return {
      id: chance.integer(),
      username: chance.name(),
      permissionLevel: "admin:unlimited",
      ...overrides,
    };
  }
}
