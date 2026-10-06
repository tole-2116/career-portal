import { Router, type Router as RouterType } from "express";
import { adminTaxonomyController } from "../controllers/admin-taxonomy.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminTaxonomyRoutes: RouterType = Router();
adminTaxonomyRoutes.use(requireAuth, requireRole("ADMIN", "RECRUITER"));
adminTaxonomyRoutes.get("/", adminTaxonomyController.list);
adminTaxonomyRoutes.post("/", adminTaxonomyController.create);
adminTaxonomyRoutes.put("/:id/move", adminTaxonomyController.move);
adminTaxonomyRoutes.put("/:id", adminTaxonomyController.update);
adminTaxonomyRoutes.delete("/:id", adminTaxonomyController.delete);
adminTaxonomyRoutes.post("/groups", adminTaxonomyController.createGroup);
adminTaxonomyRoutes.delete("/groups/:key", adminTaxonomyController.deleteGroup);
adminTaxonomyRoutes.post("/reset", adminTaxonomyController.reset);

export default adminTaxonomyRoutes;
