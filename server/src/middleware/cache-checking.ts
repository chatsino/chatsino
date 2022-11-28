import { isCacheHealthy } from "persistence";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticated-route";
import { errorResponse } from "helpers";

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
