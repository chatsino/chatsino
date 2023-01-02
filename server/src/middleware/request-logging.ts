import * as config from "config";
import type { NextFunction, Request, Response } from "express";
import { createLogger } from "logger";

const INCOMING_REQUEST_LOGGER = createLogger(config.LOGGER_NAMES.REQUEST);

export function requestLoggingMiddleware(
  req: Request,
  _: Response,
  next: NextFunction
) {
  const { userId } = req.session as UserSession;

  INCOMING_REQUEST_LOGGER.info(
    {
      userId,
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
