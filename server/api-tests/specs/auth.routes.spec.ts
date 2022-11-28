import Chance from "chance";
import {
  expectErrorMessage,
  getTicket,
  makeRequest,
  signin,
  signout,
  validate,
} from "../utils";
import type { Client } from "persistence";

const CHANCE = new Chance();

describe("Auth Routes", () => {
  let existingUsername = "";
  let existingPassword = "";
  const signupRoute = "/api/auth/signup";
  const signinRoute = "/api/auth/signin";

  describe("signupRoute", () => {
    it("should create a client and assign a token successfully.", async () => {
      const username = CHANCE.word({ length: 12 });
      const password = CHANCE.word({ length: 8 });
      const { client } = await makeRequest<{ client: Client }>(
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
        await makeRequest<{ client: Client }>("post", signupRoute, {
          username,
          password,
          passwordAgain: CHANCE.word({ length: 8 }),
        });
      } catch (error) {
        expectErrorMessage(error, "Passwords must match.");
      }

      expect.hasAssertions();
    });

    it("should fail to create a client and assign a token if a client with the same username already exists.", async () => {
      const password = CHANCE.word({ length: 8 });

      try {
        await makeRequest<{ client: Client }>("post", signupRoute, {
          username: existingUsername,
          password,
          passwordAgain: password,
        });
      } catch (error) {
        expectErrorMessage(
          error,
          `The username "${existingUsername}" is taken.`
        );
      }

      expect.hasAssertions();
    });
  });

  describe("signinRoute", () => {
    it("should assign a token successfully.", async () => {
      const client = await signin(existingUsername, existingPassword);

      expect(client).toBeDefined();
    });

    it("should fail to assign a token if the body validation fails.", async () => {
      try {
        await makeRequest<{ client: Client }>("post", signinRoute, {
          username: existingUsername,
        });
      } catch (error) {
        expectErrorMessage(
          error,
          "A password must include a minimum of 8 characters."
        );
      }

      expect.hasAssertions();
    });

    it("should fail to assign a token if password validation fails.", async () => {
      try {
        await signin(existingUsername, CHANCE.word({ length: 8 }));
      } catch (error) {
        expectErrorMessage(error, "Incorrect password.");
      }

      expect.hasAssertions();
    });

    it("should fail to assign a token if no such client with username exists.", async () => {
      try {
        await signin(CHANCE.word({ length: 12 }), CHANCE.word({ length: 8 }));
      } catch (error) {
        expectErrorMessage(error, "Unable to sign in.");
      }

      expect.hasAssertions();
    });
  });

  describe("signoutRoute", () => {
    it("should revoke a token successfully.", async () => {
      await signin(existingUsername, existingPassword);
      const client = (await validate()) as Client;
      expect(client.username).toBe(existingUsername);

      await signout();
      const clientAfterSignout = await validate();
      expect(clientAfterSignout).toBeNull();
    });

    it("should fail to revoke a token if the request has no associated client.", async () => {
      try {
        await signout();
      } catch (error) {
        expectErrorMessage(error, "Unable to sign out.");
      }

      expect.hasAssertions();
    });
  });

  describe("validateRoute", () => {
    it("should retrieve a client only when a user is signed in.", async () => {
      const clientBefore = (await validate()) as Client;
      expect(clientBefore).toBeNull();

      await signin(existingUsername, existingPassword);
      const clientAfterSignin = (await validate()) as Client;
      expect(clientAfterSignin.username).toBe(existingUsername);

      await signout();
      const clientAfterSignout = await validate();
      expect(clientAfterSignout).toBeNull();
    });
  });

  describe("ticketRoute", () => {
    it("should issue a ticket successfully.", async () => {
      await signin(existingUsername, existingPassword);
      const ticket = await getTicket();
      expect(ticket.length).toBeGreaterThan(0);
      await signout();
    });

    it("should fail to issue a ticket if the request has no associated client.", async () => {
      try {
        await getTicket();
      } catch (error) {
        expectErrorMessage(error, "Unable to assign ticket.");
      }

      expect.hasAssertions();
    });
  });
});
