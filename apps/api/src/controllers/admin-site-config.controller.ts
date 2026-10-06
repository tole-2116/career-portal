import type { Request, Response } from "express";
import {
  adminSiteConfigService,
  type SiteConfigPayload,
} from "../services/admin-site-config.service";

function bodyOf(value: unknown): Partial<SiteConfigPayload> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be an object");
  }
  return value as Partial<SiteConfigPayload>;
}

export class AdminSiteConfigController {
  constructor() {
    this.get = this.get.bind(this);
    this.save = this.save.bind(this);
    this.reset = this.reset.bind(this);
  }

  async get(_req: Request, res: Response) {
    try {
      return res.json({ success: true, data: await adminSiteConfigService.get() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch site configuration";
      return res.status(message.includes("not found") ? 404 : 500).json({ success: false, error: message });
    }
  }

  async save(req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        data: await adminSiteConfigService.save(bodyOf(req.body), req.user?.id ?? "admin"),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save site configuration";
      return res.status(400).json({ success: false, error: message });
    }
  }

  async reset(req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        data: await adminSiteConfigService.reset(req.user?.id ?? "admin"),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset site configuration";
      return res.status(500).json({ success: false, error: message });
    }
  }
}

export const adminSiteConfigController = new AdminSiteConfigController();
