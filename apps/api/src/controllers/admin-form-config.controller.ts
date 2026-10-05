import type { Request, Response } from "express";
import { adminFormConfigService, type FormConfigDto } from "../services/admin-form-config.service";

function bodyOf(value: unknown): Partial<FormConfigDto> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Request body must be an object");
  }
  return value as Partial<FormConfigDto>;
}

export class AdminFormConfigController {
  constructor() {
    this.get = this.get.bind(this);
    this.save = this.save.bind(this);
    this.reset = this.reset.bind(this);
  }

  async get(_req: Request, res: Response) {
    try {
      return res.json({ success: true, data: await adminFormConfigService.get() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch form configuration";
      return res.status(message.includes("not found") ? 404 : 500).json({ success: false, error: message });
    }
  }

  async save(req: Request, res: Response) {
    try {
      const actor = req.user?.id ?? "admin";
      return res.json({ success: true, data: await adminFormConfigService.save(bodyOf(req.body), actor) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save form configuration";
      return res.status(400).json({ success: false, error: message });
    }
  }

  async reset(req: Request, res: Response) {
    try {
      return res.json({ success: true, data: await adminFormConfigService.reset(req.user?.id ?? "admin") });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset form configuration";
      return res.status(500).json({ success: false, error: message });
    }
  }
}

export const adminFormConfigController = new AdminFormConfigController();
