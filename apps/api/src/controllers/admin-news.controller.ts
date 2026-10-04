import type { Request, Response } from "express";
import { adminNewsService } from "../services/admin-news.service";
import type { NewsModel, NewsModelQuery, NewsCategoryPayload } from "../types/news";

function parsePositiveInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return parsed;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  throw new Error("published must be a boolean");
}

function localized(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  const raw = value as { vi?: unknown; en?: unknown };
  const vi = typeof raw.vi === "string" ? raw.vi.trim() : "";
  const en = typeof raw.en === "string" ? raw.en.trim() : "";
  if (!vi && !en) throw new Error(`${field} must contain vi or en text`);
  return { vi: vi || en, en: en || vi };
}

function readNewsPayload(body: unknown, partial = false): NewsModel {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be an object");
  }

  const raw = body as Record<string, unknown>;
  const has = (field: string) => raw[field] !== undefined;

  const categoryId = typeof raw.categoryId === "string" ? raw.categoryId.trim() : "";
  if (!categoryId && !partial) throw new Error("categoryId is required");
  if (categoryId === "" && partial && has("categoryId")) throw new Error("categoryId is required");

  const title = partial && !has("title") ? undefined : localized(raw.title, "title");
  const excerpt = partial && !has("excerpt") ? undefined : localized(raw.excerpt, "excerpt");
  const articleBody = partial && !has("body") ? undefined : localized(raw.body, "body");
  const slug = raw.slug === undefined ? undefined : typeof raw.slug === "string" ? raw.slug.trim() : "";
  if (slug !== undefined && !slug) throw new Error("slug must not be empty");

  const date = raw.date === undefined ? undefined : typeof raw.date === "string" ? raw.date : "";
  if (date !== undefined && Number.isNaN(new Date(date).getTime())) {
    throw new Error("date must be a valid date");
  }

  const coverUrl = raw.coverUrl === undefined
    ? undefined
    : raw.coverUrl === null
      ? null
      : typeof raw.coverUrl === "string" ? raw.coverUrl.trim() : "";
  if (coverUrl === "") throw new Error("coverUrl must be a string or null");

  if (raw.published !== undefined && typeof raw.published !== "boolean") {
    throw new Error("published must be a boolean");
  }
  if (raw.featured !== undefined && typeof raw.featured !== "boolean") {
    throw new Error("featured must be a boolean");
  }

  return {
    slug,
    categoryId: categoryId || undefined,
    title,
    excerpt,
    body: articleBody,
    coverUrl,
    date,
    published: raw.published as boolean | undefined,
    featured: raw.featured as boolean | undefined,
  } as NewsModel;
}

export class AdminNewsController {
  constructor() {
    this.getPaginated = this.getPaginated.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.categories = this.categories.bind(this);
    this.createCategory = this.createCategory.bind(this);
    this.deleteCategory = this.deleteCategory.bind(this);
    this.uploadCover = this.uploadCover.bind(this);
  }

  async getPaginated(req: Request, res: Response) {
    try {
      const query: NewsModelQuery = {
        page: parsePositiveInteger(req.query.page, "page"),
        limit: parsePositiveInteger(req.query.limit, "limit"),
        categoryId: typeof req.query.categoryId === "string" ? req.query.categoryId : undefined,
        search: typeof req.query.search === "string" ? req.query.search : undefined,
        published: parseOptionalBoolean(req.query.published),
      };
      const result = await adminNewsService.findMany(query);
      return res.json({
        success: true,
        data: result,
        meta: { page: result.page, totalPages: result.totalPages, total: result.total },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch news";
      const status = message.includes("must be a positive integer") || message.includes("must be a boolean") ? 400 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }

  async getDetail(req: Request, res: Response) {
    try {
      const article = await adminNewsService.findById(req.params.id);
      if (!article) return res.status(404).json({ success: false, error: "News article not found" });
      return res.json({ success: true, data: article });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch news article";
      return res.status(500).json({ success: false, error: message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const payload = readNewsPayload(req.body);
      const article = await adminNewsService.create(payload, req.user?.id ?? "");
      return res.status(201).json({ success: true, data: article });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create news article";
      const status = message.includes("required") || message.includes("must be") ? 400 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const payload = readNewsPayload(req.body, true);
      const article = await adminNewsService.update(req.params.id, payload);
      return res.json({ success: true, data: article });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update news article";
      const status = message.includes("required") || message.includes("must be") ? 400 : message.includes("not found") ? 404 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const article = await adminNewsService.delete(req.params.id);
      return res.json({ success: true, data: { id: article.id, deleted: true } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete news article";
      const status = message.includes("not found") ? 404 : 500;
      return res.status(status).json({ success: false, error: message });
    }
  }

  async categories(_req: Request, res: Response) {
    try {
      return res.json({ success: true, data: await adminNewsService.findCategories() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch news categories";
      return res.status(500).json({ success: false, error: message });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const raw = req.body as Record<string, unknown>;
      const label = localized(raw?.label, "label");
      const code = raw?.code === undefined ? undefined : typeof raw.code === "string" ? raw.code.trim() : "";
      if (code === "") throw new Error("code must be a string");
      const payload: NewsCategoryPayload = { code, label };
      return res.status(201).json({ success: true, data: await adminNewsService.createCategory(payload) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create news category";
      return res.status(400).json({ success: false, error: message });
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const category = await adminNewsService.deleteCategory(req.params.id);
      return res.json({ success: true, data: { id: category.id, deleted: true } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete news category";
      return res.status(500).json({ success: false, error: message });
    }
  }

  async uploadCover(req: Request, res: Response) {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: "Image file is required" });
    return res.json({ success: true, data: { url: `/uploads/${file.filename}` } });
  }
}

export const adminNewsController = new AdminNewsController();
