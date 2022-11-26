import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import * as config from "config";
import { Express } from "express";
import { clientSettingMiddleware } from "./client-setting";

export * from "./authenticated-route";
export * from "./client-setting";

export function applyMiddleware(app: Express) {
  app.use(
    bodyParser.json(),
    cookieParser(config.COOKIE_SECRET),
    clientSettingMiddleware
  );
}
