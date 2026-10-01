import { Router, type Router as RouterType } from "express";
import { JobController } from "../controllers/job.controller";

const jobController = new JobController();

export const adminJobsRoutes: RouterType = Router();

// GET /api/admin/jobs — danh sách jobs (phân trang, lọc, tìm kiếm)
adminJobsRoutes.get("/", jobController.list);

// GET /api/admin/jobs/taxonomies — danh mục cho form (phải khai báo TRƯỚC "/:id")
adminJobsRoutes.get("/taxonomies", jobController.taxonomies);

// GET /api/admin/jobs/:id — chi tiết một job
adminJobsRoutes.get("/:id", jobController.getById);

// POST /api/admin/jobs — tạo job mới
adminJobsRoutes.post("/", jobController.create);

// PUT /api/admin/jobs/:id — cập nhật job
adminJobsRoutes.put("/:id", jobController.update);

// PATCH /api/admin/jobs/:id — cập nhật một phần
adminJobsRoutes.patch("/:id", jobController.update);

// DELETE /api/admin/jobs/:id — xoá job
adminJobsRoutes.delete("/:id", jobController.delete);

export default adminJobsRoutes;
