import { NextFunction, Response, Request } from "express";
import { errorResponse, meetsPermissionRequirement } from "helpers";
import { ClientPermissionLevel, SafeClient } from "models";

export interface AuthenticatedRequest extends Request {
  chatsinoClient: null | SafeClient;
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
