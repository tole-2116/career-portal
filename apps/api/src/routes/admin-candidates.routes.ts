import { Router, type Router as RouterType } from "express";
import { adminCandidateController } from "../controllers/admin-candidate.controller";
import { requireAuth, requireRole } from "../middleware/auth";

export const adminCandidateRoutes: RouterType = Router();
adminCandidateRoutes.use(requireAuth, requireRole("ADMIN"));

// GET /api/admin/candidates — danh sách ứng viên (phân trang, lọc, tìm kiếm)
adminCandidateRoutes.get("/", adminCandidateController.getPaginated);

// GET /api/admin/candidates/taxonomies — taxonomy experience dùng filter có ID thực từ DB
adminCandidateRoutes.get("/taxonomies", adminCandidateController.getExperienceTaxonomies);

// GET /api/admin/candidates/open — hồ sơ tự do (Candidate chưa gắn tin, jobId null)
adminCandidateRoutes.get("/open", adminCandidateController.getOpen);

// GET /api/admin/candidates/:id/cv — stream file CV để admin xem/tải trong viewer
adminCandidateRoutes.get("/:id/cv", adminCandidateController.streamCv);

// PATCH /api/admin/candidates/:id/status — cập nhật giai đoạn tuyển dụng
adminCandidateRoutes.patch("/:id/status", adminCandidateController.updateStatus);

// PATCH /api/admin/candidates/:id/job — gán hồ sơ tự do vào tin tuyển dụng
adminCandidateRoutes.patch("/:id/job", adminCandidateController.assignJob);

// PUT /api/admin/candidates/:id — cập nhật hồ sơ ứng viên
adminCandidateRoutes.put("/:id", adminCandidateController.update);

// DELETE /api/admin/candidates/:id — xoá mềm hồ sơ
adminCandidateRoutes.delete("/:id", adminCandidateController.remove);

export default adminCandidateRoutes;
