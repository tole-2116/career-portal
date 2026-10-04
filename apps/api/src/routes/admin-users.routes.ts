import { Router, type Router as RouterType } from "express";
import { adminUserController } from "../controllers/admin-user.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminUserRoutes: RouterType = Router();
adminUserRoutes.use(requireAuth, requireRole("ADMIN"));

adminUserRoutes.get("/", adminUserController.getPaginated);
adminUserRoutes.post("/", adminUserController.create);
adminUserRoutes.put("/:id", adminUserController.update);
adminUserRoutes.patch("/:id", adminUserController.update);
adminUserRoutes.delete("/:id", adminUserController.remove);

export default adminUserRoutes;
