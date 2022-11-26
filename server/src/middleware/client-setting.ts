import { validateToken } from "auth";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./authenticated-route";

export async function clientSettingMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    req.chatsinoClient = null;
    return next();
  }

  const client = await validateToken(accessToken);

  if (!client) {
    res.clearCookie("token");
    req.chatsinoClient = null;
    return next();
  }

  req.chatsinoClient = client;

  return next();
}
