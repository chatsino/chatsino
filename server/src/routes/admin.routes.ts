import { Request, Response, Router } from "express";
import { errorResponse, successResponse } from "helpers";
import { authenticatedRouteMiddleware } from "middleware";
import {
  changeClientPermissionLevel,
  chargeClient,
  ClientPermissionLevel,
  payClient,
} from "models";
import { adminChangePermissionSchema, adminPaymentSchema } from "schemas";

export function createAdminRouter() {
  const adminRouter = Router();

  adminRouter.post("/charge-client", chargeClientRoute);
  adminRouter.post("/pay-client", payClientRoute);
  adminRouter.post(
    "/change-permission",
    authenticatedRouteMiddleware("admin:unlimited"),
    changeClientPermissionRoute
  );

  return adminRouter;
}

export async function chargeClientRoute(req: Request, res: Response) {
  try {
    const { clientId, amount } = await adminPaymentSchema.validate(req.body);
    const charged = await chargeClient(clientId, amount, "Admin charge");

    if (!charged) {
      throw new Error();
    }

    return successResponse(res, "Successfully charged client.");
  } catch (error) {
    return errorResponse(res, "Unable to charge client.");
  }
}

export async function payClientRoute(req: Request, res: Response) {
  try {
    const { clientId, amount } = await adminPaymentSchema.validate(req.body);
    const paid = await payClient(clientId, amount, "Admin payment");

    if (!paid) {
      throw new Error();
    }

    return successResponse(res, "Successfully paid client.");
  } catch (error) {
    return errorResponse(res, "Unable to pay client.");
  }
}

export async function changeClientPermissionRoute(req: Request, res: Response) {
  try {
    const { clientId, permissionLevel } =
      await adminChangePermissionSchema.validate(req.body);
    const client = await changeClientPermissionLevel(
      clientId,
      permissionLevel as ClientPermissionLevel
    );

    if (!client) {
      throw new Error();
    }

    return successResponse(
      res,
      "Successfully changed client's permission level.",
      {
        client,
      }
    );
  } catch (error) {
    return errorResponse(res, "Unable to change client's permission level.");
  }
}
