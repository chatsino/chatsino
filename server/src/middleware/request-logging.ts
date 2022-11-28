import { createLogger } from "logger";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticated-route";

const INCOMING_REQUEST_LOGGER = createLogger("Incoming Request");

export function requestLoggingMiddleware(
  req: AuthenticatedRequest,
  _: Response,
  next: NextFunction
) {
  if (process.env.NODE_ENV === "development") {
    INCOMING_REQUEST_LOGGER.info(
      {
        client: req.chatsinoClient ?? null,
        ip: req.ip,
        path: req.path,
        params: req.params,
        body: req.body,
        authorization: req.headers.authorization,
      },
      "A new request was made."
    );
  }

  return next();
}
