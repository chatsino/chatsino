import { UserSocketRequests } from "enums";
import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "helpers";
import { requiredRoleMiddleware } from "middleware";
import { makeRequest } from "models";
import { User, userValidators } from "validators";

export function createAdminRouter() {
  const adminRouter = Router();

  adminRouter.post("/charge-client", chargeUserRoute);
  adminRouter.post("/pay-client", payUserRoute);
  adminRouter.post(
    "/change-permission",
    requiredRoleMiddleware("administrator"),
    changeUserRoleRoute
  );

  return adminRouter;
}

export async function chargeUserRoute(req: Request, res: Response) {
  try {
    const { userId, amount } = await userValidators[
      UserSocketRequests.ChargeUser
    ].validate(req.body);
    const { user } = (await makeRequest(UserSocketRequests.ChargeUser, {
      userId,
      amount,
    })) as {
      user: Nullable<User>;
    };

    if (!user) {
      throw new Error();
    }

    return successResponse(res, "Successfully charged user.");
  } catch (error) {
    return errorResponse(res, "Unable to charge user.");
  }
}

export async function payUserRoute(req: Request, res: Response) {
  try {
    const { userId, amount } = await userValidators[
      UserSocketRequests.PayUser
    ].validate(req.body);
    const { user } = (await makeRequest(UserSocketRequests.PayUser, {
      userId,
      amount,
    })) as {
      user: Nullable<User>;
    };

    if (!user) {
      throw new Error();
    }

    return successResponse(res, "Successfully paid user.");
  } catch (error) {
    return errorResponse(res, "Unable to pay user.");
  }
}

export async function changeUserRoleRoute(req: Request, res: Response) {
  try {
    const { userId: modifyingUserId } = req.session as UserSession;
    const { userId: modifiedUserId, role } = await userValidators[
      UserSocketRequests.ReassignUser
    ].validate(req.body);
    const { user } = (await makeRequest(UserSocketRequests.ReassignUser, {
      modifyingUserId,
      modifiedUserId,
      role,
    })) as {
      user: Nullable<User>;
    };

    if (!user) {
      throw new Error();
    }

    return successResponse(res, "Successfully changed users's role.", {
      user,
    });
  } catch (error) {
    return errorResponse(res, "Unable to change user's role.");
  }
}
