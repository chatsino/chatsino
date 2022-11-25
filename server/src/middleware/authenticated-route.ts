import { NextFunction, Response, Request } from "express";
import { errorResponse, meetsPermissionRequirement } from "helpers";

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
