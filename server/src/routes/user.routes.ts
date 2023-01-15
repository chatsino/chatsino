import * as config from "config";
import { Request, Response, Router } from "express";
import { createLogger, errorResponse, successResponse } from "helpers";
import querystring from "node:querystring";
import { makeRequest, User, UserSocketRequests } from "models";

export const USER_ROUTER_LOGGER = createLogger(config.LOGGER_NAMES.USER_ROUTER);

// Router
export function createUserRouter() {
  const userRouter = Router();

  userRouter.get("/", getUsersRoute);

  return userRouter;
}

// Routes
export async function getUsersRoute(req: Request, res: Response) {
  try {
    const { userId = "(anonymous)" } = req.session as UserSession;
    const { "/users?username": usernameQueryParam } = querystring.parse(
      req.url
    );
    const { "/users?ids": userIdsQueryParam } = querystring.parse(req.url);

    if (typeof usernameQueryParam === "string") {
      const { users } = (await makeRequest(
        userId,
        UserSocketRequests.GetUsersWithUsername,
        {
          username: usernameQueryParam,
        }
      )) as {
        users: User[];
      };

      return successResponse(
        res,
        "Successfully retrieved users with username.",
        {
          users,
        }
      );
    } else if (typeof userIdsQueryParam === "string") {
      const userIds = JSON.parse(userIdsQueryParam) as string[];
      const { users } = (await makeRequest(
        userId,
        UserSocketRequests.GetUsersByUserIds,
        {
          userIds,
        }
      )) as {
        users: User[];
      };

      return successResponse(res, "Successfully retrieved users with ids.", {
        users,
      });
    } else {
      const { users } = (await makeRequest(
        userId,
        UserSocketRequests.GetAllUsers
      )) as {
        users: User[];
      };

      return successResponse(res, "Successfully retrieved users.", {
        users,
      });
    }
  } catch (error) {
    return errorResponse(res, "Unable to retrieve users.");
  }
}
