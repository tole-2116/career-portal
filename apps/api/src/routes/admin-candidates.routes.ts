import { Router, type Router as RouterType } from "express";
import { adminCandidateController } from "../controllers/admin-candidate.controller";
import { requireAuth } from "../middleware/auth";

export const adminCandidateRoutes: RouterType = Router();
adminCandidateRoutes.use(requireAuth);

// GET /api/admin/candidates — danh sách ứng viên (phân trang, lọc, tìm kiếm)
adminCandidateRoutes.get("/", adminCandidateController.getPaginated);

// GET /api/admin/candidates/taxonomies — taxonomy experience dùng filter có ID thực từ DB
adminCandidateRoutes.get("/taxonomies", adminCandidateController.getExperienceTaxonomies);

// PATCH /api/admin/candidates/:id/status — cập nhật giai đoạn tuyển dụng
adminCandidateRoutes.patch("/:id/status", adminCandidateController.updateStatus);

// PUT /api/admin/candidates/:id — cập nhật hồ sơ ứng viên
adminCandidateRoutes.put("/:id", adminCandidateController.update);

export default adminCandidateRoutes;
