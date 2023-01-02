import { UserSocketRequests } from "enums";
import { NextFunction, Request, Response } from "express";
import { errorResponse } from "helpers";
import { User, UserRole } from "validators";
import { makeRequest } from "_models";

export const USER_ROLE_RANKING: UserRole[] = [
  "user",
  "moderator",
  "administrator",
  "operator",
];

export function requiredRoleMiddleware(roleRequirement: UserRole) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { userId } = req.session as UserSession;
    const { user } = (await makeRequest(UserSocketRequests.GetUser, {
      userId,
    })) as {
      user: User;
    };
    const roleRequirementIndex = USER_ROLE_RANKING.indexOf(roleRequirement);
    const userRoleIndex = USER_ROLE_RANKING.indexOf(user.role);
    const isAllowed = userRoleIndex >= roleRequirementIndex;

    return isAllowed
      ? next()
      : errorResponse(
          res,
          "You do not have permission to access that resource or perform that action."
        );
  };
}
