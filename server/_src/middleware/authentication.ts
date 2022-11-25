import { NextFunction, Request, Response } from "express";
import { errorResponse, meetsPermissionRequirement } from "../__src/helpers";
import { ClientPermissionLevel } from "../__src/repositories";
import { AuthenticatedClient, AuthenticationService } from "../__src/services";

export interface AuthenticatedRequest extends Request {
  client: null | AuthenticatedClient;
}

export function authenticatedRouteMiddleware(
  permissionLevel: ClientPermissionLevel
) {
  return function (
    { client }: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const deny = () =>
      errorResponse(
        res,
        "You do not have permission to access that resource or perform that action."
      );
    const canAccess = Boolean(
      client &&
        meetsPermissionRequirement(permissionLevel, client.permissionLevel)
    );

    return canAccess ? next() : deny();
  };
}

export async function clientSettingMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    req.client = null;
    return next();
  }

  const authenticationService = new AuthenticationService();
  const tokenData = await authenticationService.validateToken(accessToken);

  if (!tokenData) {
    res.clearCookie("accessToken");
    req.client = null;
    return next();
  }

  req.client = tokenData;

  return next();
}
