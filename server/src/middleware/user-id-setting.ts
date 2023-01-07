import { getCachedValue } from "cache";
import { NextFunction, Request, Response } from "express";

export async function userIdSettingMiddleware(
  req: Request & { session: UserSession },
  _: Response,
  next: NextFunction
) {
  if (!req.session.userId) {
    const token = req.headers.authorization;

    if (token) {
      const userId = (await getCachedValue(`Token:${token}`)) as string;

      if (userId) {
        req.session.userId = userId;
      }
    }
  }

  return next();
}
