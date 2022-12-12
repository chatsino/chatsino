import type { NextFunction, Response } from "express";
import { createLogger } from "logger";
import type { AuthenticatedRequest } from "./authenticated-route";

const INCOMING_REQUEST_LOGGER = createLogger("Incoming Request");

export function requestLoggingMiddleware(
  req: AuthenticatedRequest,
  _: Response,
  next: NextFunction
) {
  INCOMING_REQUEST_LOGGER.info(
    {
      client: req.chatsinoClient ?? null,
      ip: req.ip,
      path: req.path,
      query: req.query,
      params: req.params,
      body: req.body,
    },
    "A new request was made."
  );

  return next();
}
