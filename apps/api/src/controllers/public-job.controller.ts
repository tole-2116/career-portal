import { Request, Response } from "express";
import { AdminJobService } from "../services/admin-job.service";
import type { JobModelQuery } from "../types/job";

export class PublicJobController {
  private readonly service = new AdminJobService();

  constructor() {
    this.getPaginated = this.getPaginated.bind(this);
    this.getDetail = this.getDetail.bind(this);
  }

  async getPaginated(req: Request, res: Response) {
    try {
      const query: Omit<JobModelQuery, "status"> = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        departmentId: req.query.departmentId as string | undefined,
        locationIds: req.query.locationIds as string | undefined,
        workTypeId: req.query.workTypeId as string | undefined,
        salaryId: req.query.salaryId as string | undefined,
        experienceId: req.query.experienceId as string | undefined,
        search: req.query.search as string | undefined,
      };

      const result = await this.service.findPublic(query);
      res.json({
        success: true,
        data: result,
        meta: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    } catch (error) {
      console.error("GET /api/jobs error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch jobs",
      });
    }
  }

  async getDetail(req: Request, res: Response) {
    try {
      const job = await this.service.findPublicById(req.params.id);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found",
        });
      }

      return res.json({ success: true, data: job });
    } catch (error) {
      console.error("GET /api/jobs/:id error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch job",
      });
    }
  }
}

export const publicJobController = new PublicJobController();
