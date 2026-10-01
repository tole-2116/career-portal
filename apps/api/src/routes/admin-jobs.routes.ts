import { Router, type Router as RouterType } from "express";
import { AdminJobController } from "../controllers/admin-job.controller";

const adminJobController = new AdminJobController();

export const adminJobsRoutes: RouterType = Router();

// GET /api/admin/jobs — danh sách jobs (phân trang, lọc, tìm kiếm)
adminJobsRoutes.get("/", adminJobController.getPaginated);

// GET /api/admin/jobs/taxonomies — danh mục cho form (phải khai báo TRƯỚC "/:id")
adminJobsRoutes.get("/taxonomies", adminJobController.taxonomies);

// GET /api/admin/jobs/:id — chi tiết một job
adminJobsRoutes.get("/:id", adminJobController.getDetail);

// POST /api/admin/jobs — tạo job mới
adminJobsRoutes.post("/", adminJobController.create);

// PUT /api/admin/jobs/:id — cập nhật job
adminJobsRoutes.put("/:id", adminJobController.update);

// PATCH /api/admin/jobs/:id — cập nhật một phần
adminJobsRoutes.patch("/:id", adminJobController.update);

// DELETE /api/admin/jobs/:id — xoá job
adminJobsRoutes.delete("/:id", adminJobController.delete);

export default adminJobsRoutes;
