import { Router, type Router as RouterType } from "express";
import { adminContactController } from "../controllers/admin-contact.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminContactRoutes: RouterType = Router();
adminContactRoutes.use(requireAuth, requireRole("ADMIN"));

adminContactRoutes.get("/", adminContactController.getPaginated);
adminContactRoutes.get("/:id", adminContactController.getOne);
adminContactRoutes.patch("/:id/status", adminContactController.updateStatus);

export default adminContactRoutes;
