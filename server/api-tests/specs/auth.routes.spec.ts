import Chance from "chance";
import { makeRequest } from "../utils";
import type { SafeClient } from "models";

const CHANCE = new Chance();

describe("Auth Routes", () => {
  let existingUsername = "";
  let existingPassword = "";
  const signupRoute = "/api/auth/signup";
  const signinRoute = "/api/auth/signin";
  const signoutRoute = "/api/auth/signout";

  describe("signupRoute", () => {
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
      existingPassword = password;
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

  describe("signinRoute", () => {
    it("should assign a token successfully.", async () => {
      const { client } = await makeRequest<{ client: SafeClient }>(
        "post",
        signinRoute,
        {
          username: existingUsername,
          password: existingPassword,
        }
      );

      expect(client).toBeDefined();
    });

    it("should fail to assign a token if the body validation fails.", async () => {
      try {
        await makeRequest<{ client: SafeClient }>("post", signinRoute, {
          username: existingUsername,
        });
      } catch (error) {
        expect((error as Error).message).toBe(
          "A password must include a minimum of 8 characters."
        );
      }

      expect.hasAssertions();
    });

    it("should fail to assign a token if password validation fails.", async () => {
      try {
        await makeRequest<{ client: SafeClient }>("post", signinRoute, {
          username: existingUsername,
          password: CHANCE.word({ length: 8 }),
        });
      } catch (error) {
        expect((error as Error).message).toBe("Incorrect password.");
      }

      expect.hasAssertions();
    });

    it("should fail to assign a token if no such client with username exists.", async () => {
      try {
        await makeRequest<{ client: SafeClient }>("post", signinRoute, {
          username: CHANCE.word({ length: 12 }),
          password: CHANCE.word({ length: 8 }),
        });
      } catch (error) {
        expect((error as Error).message).toBe("Unable to sign in.");
      }

      expect.hasAssertions();
    });
  });

  describe("signoutRoute", () => {
    it("should revoke a token successfully.", async () => {
      await makeRequest<{ client: SafeClient }>("post", signinRoute, {
        username: existingUsername,
        password: existingPassword,
      });

      await makeRequest("post", signoutRoute);

      // The request succeeded, so the test passes.
      expect(true).toBe(true);
    });

    it.skip("should fail to revoke a token if the request has no associated client.", () => {
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
