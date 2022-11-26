import { Express } from "express";
import { applyAdminRoutes } from "./admin.routes";
import { applyAuthRoutes } from "./auth.routes";
import { applyStaticRoutes } from "./static.routes";

export function applyRoutes(app: Express) {
  applyAdminRoutes(app);
  applyAuthRoutes(app);
  applyStaticRoutes(app);
}
