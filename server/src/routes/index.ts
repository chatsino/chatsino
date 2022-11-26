import { Express, Router } from "express";
import { applyAdminRoutes } from "./admin.routes";
import { applyAuthRoutes } from "./auth.routes";
import { applyStaticRoutes } from "./static.routes";

export function applyRoutes(app: Express) {
  const api = Router();

  applyAdminRoutes(api);
  applyAuthRoutes(api);
  applyStaticRoutes(api);

  app.use("/api", api);
}
