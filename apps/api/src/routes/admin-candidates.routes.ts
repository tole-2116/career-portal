import { Router, type Router as RouterType } from "express";
import { adminCandidateController } from "../controllers/admin-candidate.controller";

export const adminCandidateRoutes: RouterType = Router();

// GET /api/admin/candidates — danh sách ứng viên (phân trang, lọc, tìm kiếm)
adminCandidateRoutes.get("/", adminCandidateController.getPaginated);

// PATCH /api/admin/candidates/:id/status — cập nhật giai đoạn tuyển dụng
adminCandidateRoutes.patch("/:id/status", adminCandidateController.updateStatus);

export default adminCandidateRoutes;
