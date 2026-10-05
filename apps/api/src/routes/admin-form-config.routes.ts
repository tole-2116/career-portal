import { Router, type Router as RouterType } from "express";
import { adminFormConfigController } from "../controllers/admin-form-config.controller";
import { requireAuth } from "../middleware/auth";

export const adminFormConfigRoutes: RouterType = Router();
adminFormConfigRoutes.use(requireAuth);
adminFormConfigRoutes.get("/", adminFormConfigController.get);
adminFormConfigRoutes.put("/", adminFormConfigController.save);
adminFormConfigRoutes.post("/reset", adminFormConfigController.reset);

export default adminFormConfigRoutes;
