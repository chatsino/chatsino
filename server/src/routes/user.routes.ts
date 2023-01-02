import * as config from "config";
import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "helpers";
import { createLogger } from "logger";
import { makeRequest, UserSocketRequests } from "models";

export const USER_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.USER_ROUTER);

// Router
export function createUserRouter() {
  const userRouter = Router();

  userRouter.get("/", getUsersRoute);

  return userRouter;
}

// Routes
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
