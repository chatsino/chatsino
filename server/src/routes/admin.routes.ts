import { Router } from "express";

export function applyAdminRoutes(api: Router) {
  const adminRouter = Router();

  adminRouter.post("/charge", chargeClientRoute);
  adminRouter.post("/pay", payClientRoute);
  adminRouter.post("/change-permission", changeClientPermissionRoute);

  api.use("/admin", adminRouter);
}

export function chargeClientRoute() {}

export function payClientRoute() {}

export function changeClientPermissionRoute() {}
