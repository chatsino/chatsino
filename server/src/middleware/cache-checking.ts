import type { NextFunction, Response } from "express";
import { errorResponse } from "helpers";
import { isCacheHealthy } from "persistence";
import type { AuthenticatedRequest } from "./authenticated-route";

export function cacheCheckingMiddleware(
  _: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!isCacheHealthy()) {
    return errorResponse(res, "Something is wrong -- give us a sec.");
  }

  return next();
}
