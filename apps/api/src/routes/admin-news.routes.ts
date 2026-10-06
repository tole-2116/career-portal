import { Router, type Router as RouterType } from "express";
import { adminNewsController } from "../controllers/admin-news.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { uploadCover } from "../middleware/upload";

export const adminNewsRoutes: RouterType = Router();
adminNewsRoutes.use(requireAuth, requireRole("ADMIN", "RECRUITER"));

// GET /api/admin/news — danh sách bài viết (phân trang, lọc, tìm kiếm)
adminNewsRoutes.get("/", adminNewsController.getPaginated);

// GET /api/admin/news/categories — chuyên mục tin tức từ Taxonomy type=newsCategory
adminNewsRoutes.get("/categories", adminNewsController.categories);
adminNewsRoutes.post("/categories", adminNewsController.createCategory);
adminNewsRoutes.delete("/categories/:id", adminNewsController.deleteCategory);

// POST /api/admin/news/upload — tải ảnh bìa lên uploads/
adminNewsRoutes.post("/upload", uploadCover.single("cover"), adminNewsController.uploadCover);

// GET /api/admin/news/:id — chi tiết bài viết (sau /categories để không bị bắt sai)
adminNewsRoutes.get("/:id", adminNewsController.getDetail);

// CRUD
adminNewsRoutes.post("/", adminNewsController.create);
adminNewsRoutes.put("/:id", adminNewsController.update);
adminNewsRoutes.patch("/:id", adminNewsController.update);
adminNewsRoutes.delete("/:id", adminNewsController.delete);

export default adminNewsRoutes;