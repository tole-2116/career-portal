import { Router, type Router as RouterType } from "express";
import { adminActivityController } from "../controllers/admin-activity.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminActivityRoutes: RouterType = Router();
adminActivityRoutes.use(requireAuth, requireRole("ADMIN"));
adminActivityRoutes.get("/", adminActivityController.getRecent);
