import Chance from "chance";
import { Response } from "express";
import { TestGenerator } from "helpers";
import { AuthenticatedRequest } from "./authenticated-route";
import { clientSettingMiddleware } from "./client-setting";

const CHANCE = new Chance();

const SAMPLE_AUTHENTICATED_CLIENT = TestGenerator.createClient({
  username: CHANCE.name(),
  permissionLevel: "admin:unlimited",
});

let _validateTokenResponse: null | typeof SAMPLE_AUTHENTICATED_CLIENT =
  SAMPLE_AUTHENTICATED_CLIENT;

jest.mock("auth", () => ({
  ...jest.requireActual("auth"),
  validateToken: () => _validateTokenResponse,
}));

describe("clientSettingMiddleware", () => {
  it("should properly set the request client if everything works out (with header)", async () => {
    const request = {
      chatsinoClient: null,
      headers: {
        authorization: "AN_ACCESS_TOKEN",
      },
      cookies: {},
    } as AuthenticatedRequest;
    const response = null as unknown as Response;
    const next = jest.fn();

    await clientSettingMiddleware(request, response, next);

    expect(request.chatsinoClient).toEqual(SAMPLE_AUTHENTICATED_CLIENT);
    expect(next).toHaveBeenCalled();
  });

  it("should properly set the request client if everything works out (with cookie)", async () => {
    const request = {
      chatsinoClient: null,
      headers: {},
      cookies: {
        token: "AN_ACCESS_TOKEN",
      },
    } as AuthenticatedRequest;
    const response = null as unknown as Response;
    const next = jest.fn();

    await clientSettingMiddleware(request, response, next);

    expect(request.chatsinoClient).toEqual(SAMPLE_AUTHENTICATED_CLIENT);
    expect(next).toHaveBeenCalled();
  });

  it("should set a client to null if there is no access token present", async () => {
    const request = {
      client: undefined,
      headers: {},
      cookies: {},
    } as unknown as AuthenticatedRequest;
    const response = null as unknown as Response;
    const next = jest.fn();

    await clientSettingMiddleware(request, response, next);

    expect(request.chatsinoClient).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it("should set a client to null and clear invalid tokens", async () => {
    _validateTokenResponse = null;

    const request = {
      client: undefined,
      headers: {},
      cookies: {
        token: "AN_ACCESS_TOKEN",
      },
    } as unknown as AuthenticatedRequest;
    const response = {
      clearCookie: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    await clientSettingMiddleware(request, response, next);

    expect(request.chatsinoClient).toBeNull();
    expect(response.clearCookie).toHaveBeenCalledWith("token");
    expect(next).toHaveBeenCalled();
  });
});
