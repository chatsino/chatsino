import Chance from "chance";
import { Response } from "express";
import { TestGenerator } from "helpers";
import {
  AuthenticatedRequest,
  authenticatedRouteMiddleware,
} from "./authenticated-route";

const CHANCE = new Chance();

const SAMPLE_AUTHENTICATED_CLIENT = {
  username: CHANCE.name(),
  permissionLevel: "admin:unlimited",
};

let _validateTokenResponse: null | typeof SAMPLE_AUTHENTICATED_CLIENT =
  SAMPLE_AUTHENTICATED_CLIENT;

jest.mock("services", () => ({
  ...jest.requireActual("services"),
  AuthenticationService: class {
    public async validateToken() {
      return _validateTokenResponse;
    }
  },
}));

describe("authenticatedRouteMiddleware", () => {
  it("should allow a client to access a resource if their permission level matches the requirement", () => {
    const middleware = authenticatedRouteMiddleware("admin:limited");
    const request = {
      client: TestGenerator.createAuthenticatedClient(),
    } as AuthenticatedRequest;
    const response = null as unknown as Response;
    const next = jest.fn();

    middleware(request, response, next);

    expect(next).toHaveBeenCalled();
  });

  it("should prevent a client from accessing a resource if their permission level does not match the requirement", () => {
    const client = TestGenerator.createAuthenticatedClient();
    client.permissionLevel = "admin:limited";

    const middleware = authenticatedRouteMiddleware("admin:unlimited");
    const request = {
      client,
    } as AuthenticatedRequest;
    const response = {
      status: jest.fn().mockImplementation(() => ({
        send: jest.fn(),
      })),
    } as unknown as Response;
    const next = jest.fn();

    middleware(request, response, next);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
