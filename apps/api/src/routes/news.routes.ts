import { Router, type Router as RouterType } from "express";
import { adminNewsService } from "../services/admin-news.service";

export const newsRoutes: RouterType = Router();

// Public list — chỉ trả bài đã xuất bản.
newsRoutes.get("/", async (req, res) => {
  try {
    const result = await adminNewsService.findMany({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 100,
      categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      published: true,
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch news";
    return res.status(500).json({ success: false, error: message });
  }
});

newsRoutes.get("/categories", async (_req, res) => {
  try {
    return res.json({ success: true, data: await adminNewsService.findCategories() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch news categories";
    return res.status(500).json({ success: false, error: message });
  }
});

newsRoutes.get("/:slug", async (req, res) => {
  try {
    const article = await adminNewsService.findBySlug(req.params.slug);
    if (!article) return res.status(404).json({ success: false, error: "News article not found" });
    return res.json({ success: true, data: article });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch news article";
    return res.status(500).json({ success: false, error: message });
  }
});

export default newsRoutes;