import type { Request, Response } from "express";
import { adminActivityService } from "../services/admin-activity.service";

export class AdminActivityController {
  async getRecent(_req: Request, res: Response) {
    try {
      return res.json({ success: true, data: await adminActivityService.findRecent() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch recent activity";
      console.error("GET /api/admin/activity error:", error);
      return res.status(500).json({ success: false, error: message });
    }
  }
}

export const adminActivityController = new AdminActivityController();
