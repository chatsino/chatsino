import Chance from "chance";
import { makeRequest } from "../utils";
import type { SafeClient } from "models";

const CHANCE = new Chance();

describe("Auth Routes", () => {
  let existingUsername = "";

  describe("signupRoute", () => {
    const signupRoute = "/api/auth/signup";

    it("should create a client and assign a token successfully.", async () => {
      const username = CHANCE.word({ length: 12 });
      const password = CHANCE.word({ length: 8 });
      const { client } = await makeRequest<{ client: SafeClient }>(
        "post",
        "/api/auth/signup",
        {
          username,
          password,
          passwordAgain: password,
        }
      );

      expect(client).toBeDefined();

      existingUsername = username;
    });

    it("should fail to create a client and assign a token if the body validation fails.", async () => {
      const username = CHANCE.word({ length: 12 });
      const password = CHANCE.word({ length: 8 });

      try {
        await makeRequest<{ client: SafeClient }>("post", signupRoute, {
          username,
          password,
          passwordAgain: CHANCE.word({ length: 8 }),
        });
      } catch (error) {
        expect((error as Error).message).toBe("Passwords must match.");
      }

      expect.hasAssertions();
    });

    it("should fail to create a client and assign a token if a client with the same username already exists.", async () => {
      const password = CHANCE.word({ length: 8 });

      try {
        await makeRequest<{ client: SafeClient }>("post", signupRoute, {
          username: existingUsername,
          password,
          passwordAgain: password,
        });
      } catch (error) {
        expect((error as Error).message).toBe(
          `The username "${existingUsername}" is taken.`
        );
      }

      expect.hasAssertions();
    });
  });

  describe.skip("signinRoute", () => {
    it("should assign a token successfully.", () => {
      expect(true).toBe(false);
    });

    it("should fail to assign a token if the body validation fails.", () => {
      expect(true).toBe(false);
    });

    it("should fail to assign a token if password validation fails.", () => {
      expect(true).toBe(false);
    });
  });

  describe.skip("signoutRoute", () => {
    it("should revoke a token successfully.", () => {
      expect(true).toBe(false);
    });

    it("should fail to revoke a token if the request has no associated client.", () => {
      expect(true).toBe(false);
    });
  });

  describe.skip("ticketRoute", () => {
    it("should issue a ticket successfully.", () => {
      expect(true).toBe(false);
    });

    it("should fail to issue a ticket if the request has no associated client.", () => {
      expect(true).toBe(false);
    });
  });
});
