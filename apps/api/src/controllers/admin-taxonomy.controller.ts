import type { Request, Response } from "express";
import { adminTaxonomyService, type Localized } from "../services/admin-taxonomy.service";

function readLocalized(value: unknown, allowEmpty = false): Localized {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("label must be an object");
  const raw = value as { vi?: unknown; en?: unknown };
  const vi = typeof raw.vi === "string" ? raw.vi.trim() : "";
  const en = typeof raw.en === "string" ? raw.en.trim() : "";
  if (!allowEmpty && !vi && !en) throw new Error("label must contain vi or en text");
  return { vi: vi || en, en: en || vi };
}

function readBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be an object");
  return body as Record<string, unknown>;
}

function direction(value: unknown): -1 | 1 {
  if (value === -1 || value === 1) return value;
  throw new Error("direction must be -1 or 1");
}

export class AdminTaxonomyController {
  constructor() {
    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.move = this.move.bind(this);
    this.delete = this.delete.bind(this);
    this.createGroup = this.createGroup.bind(this);
    this.deleteGroup = this.deleteGroup.bind(this);
    this.reset = this.reset.bind(this);
  }

  async list(_req: Request, res: Response) {
    try {
      return res.json({ success: true, data: await adminTaxonomyService.list() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch taxonomies";
      return res.status(500).json({ success: false, error: message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const body = readBody(req.body);
      const type = typeof body.type === "string" ? body.type.trim() : "";
      if (!type) throw new Error("type is required");
      return res.status(201).json({ success: true, data: await adminTaxonomyService.create(type, readLocalized(body.label, true)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create taxonomy";
      return res.status(400).json({ success: false, error: message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const body = readBody(req.body);
      return res.json({ success: true, data: await adminTaxonomyService.update(req.params.id, readLocalized(body.label)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update taxonomy";
      return res.status(message.includes("not found") ? 404 : 400).json({ success: false, error: message });
    }
  }

  async move(req: Request, res: Response) {
    try {
      await adminTaxonomyService.move(req.params.id, direction(readBody(req.body).direction));
      return res.json({ success: true, data: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to move taxonomy";
      return res.status(message.includes("not found") ? 404 : 400).json({ success: false, error: message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await adminTaxonomyService.delete(req.params.id);
      return res.json({ success: true, data: { id: req.params.id, deleted: true } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete taxonomy";
      return res.status(message.includes("not found") ? 404 : 500).json({ success: false, error: message });
    }
  }

  async createGroup(req: Request, res: Response) {
    try {
      return res.status(201).json({ success: true, data: await adminTaxonomyService.createGroup(readLocalized(readBody(req.body).label)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create taxonomy group";
      return res.status(400).json({ success: false, error: message });
    }
  }

  async deleteGroup(req: Request, res: Response) {
    try {
      await adminTaxonomyService.deleteGroup(req.params.key);
      return res.json({ success: true, data: { key: req.params.key, deleted: true } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete taxonomy group";
      return res.status(500).json({ success: false, error: message });
    }
  }

  async reset(_req: Request, res: Response) {
    try {
      return res.json({ success: true, data: await adminTaxonomyService.reset() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset taxonomies";
      return res.status(500).json({ success: false, error: message });
    }
  }
}

export const adminTaxonomyController = new AdminTaxonomyController();
