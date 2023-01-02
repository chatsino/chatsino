import * as config from "config";
import { UserSocketRequests } from "enums";
import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "helpers";
import { createLogger } from "logger";
import { makeRequest } from "models";

export const USER_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.USER_ROUTER);

export function createUserRouter() {
  const userRouter = Router();

  userRouter.get("/", getUsersRoute);

  return userRouter;
}

export async function getUsersRoute(_: Request, res: Response) {
  try {
    const { users } = await makeRequest(UserSocketRequests.GetAllUsers);

    return successResponse(res, "Successfully retrieved users.", {
      users,
    });
  } catch (error) {
    return errorResponse(res, "Unable to retrieve users.");
  }
}
