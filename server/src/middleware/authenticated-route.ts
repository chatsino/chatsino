import { NextFunction, Response, Request } from "express";
import { errorResponse, meetsPermissionRequirement } from "helpers";
import { ClientPermissionLevel, Client } from "persistence";

export interface AuthenticatedRequest extends Request {
  chatsinoClient: null | Client;
}

export function authenticatedRouteMiddleware(
  permissionLevel: ClientPermissionLevel
) {
  return function (
    { chatsinoClient }: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    const deny = () =>
      errorResponse(
        res,
        "You do not have permission to access that resource or perform that action."
      );
    const canAccess = Boolean(
      chatsinoClient &&
        meetsPermissionRequirement(
          permissionLevel,
          chatsinoClient.permissionLevel
        )
    );

    return canAccess ? next() : deny();
  };
}
