import * as config from "config";
import { Response, Router } from "express";
import { errorResponse, successResponse } from "helpers";
import { createLogger } from "logger";
import { AuthenticatedRequest } from "middleware";
import { CLIENT_CACHE } from "persistence";

export const USER_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.USER_ROUTER);

export function createUserRouter() {
  const userRouter = Router();

  userRouter.get("/", getUserListRoute);

  return userRouter;
}

export async function getUserListRoute(_: AuthenticatedRequest, res: Response) {
  try {
    return successResponse(res, "Successfully retrieved user list.", {
      active: await CLIENT_CACHE.ACTIVE_CLIENTS.hydrated(),
      inactive: await CLIENT_CACHE.INACTIVE_CLIENTS.hydrated(),
    });
  } catch (error) {
    return errorResponse(res, "Unable to retrieve user list.");
  }
}
