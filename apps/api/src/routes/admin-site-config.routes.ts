import { Router, type Router as RouterType } from "express";
import { adminSiteConfigController } from "../controllers/admin-site-config.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminSiteConfigRoutes: RouterType = Router();
adminSiteConfigRoutes.use(requireAuth, requireRole("ADMIN"));
adminSiteConfigRoutes.get("/", adminSiteConfigController.get);
adminSiteConfigRoutes.put("/", adminSiteConfigController.save);
adminSiteConfigRoutes.post("/reset", adminSiteConfigController.reset);

export default adminSiteConfigRoutes;
