import { Router, type Router as RouterType } from "express";
import { publicJobController } from "../controllers/public-job.controller";

export const publicJobsRoutes: RouterType = Router();

// Public job data is intentionally unauthenticated.
publicJobsRoutes.get("/", publicJobController.getPaginated);
publicJobsRoutes.get("/:id", publicJobController.getDetail);

export default publicJobsRoutes;
