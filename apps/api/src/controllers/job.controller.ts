import { Request, Response } from "express";
import { JobService } from "../services/job.service";
import { JobModel, JobModelQuery, JobStatus } from "../types/job";

export class JobController {
  private service: JobService;

  constructor() {
    this.service = new JobService();
    // Express truyền handler dưới dạng hàm rời — mất `this`, nên bind trước.
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.taxonomies = this.taxonomies.bind(this);
  }

  async list(req: Request, res: Response) {
    try {
      const query: JobModelQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        status: req.query.status as JobStatus | undefined,
        departmentId: req.query.departmentId as string | undefined,
        locationIds: req.query.locationIds as string | undefined,
        workTypeId: req.query.workTypeId as string | undefined,
        salaryId: req.query.salaryId as string | undefined,
        experienceId: req.query.experienceId as string | undefined,
        search: req.query.search as string | undefined,
      };

      const result = await this.service.getAll(query);

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
      console.error("GET /api/admin/jobs error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch jobs",
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const job = await this.service.getById(id);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found",
        });
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      console.error("GET /api/admin/jobs/:id error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch job",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data: JobModel = {
        slug: req.body.slug,
        title: req.body.title,
        summary: req.body.summary,
        description: req.body.description,
        requirements: req.body.requirements,
        benefits: req.body.benefits,
        departmentId: req.body.departmentId,
        locationIds: req.body.locationIds,
        workTypeId: req.body.workTypeId,
        salaryId: req.body.salaryId,
        experienceId: req.body.experienceId,
        level: req.body.level,
        languages: req.body.languages,
        status: req.body.status,
        isFeatured: req.body.isFeatured,
        headcount: req.body.headcount,
        contactName: req.body.contactName,
        contactEmail: req.body.contactEmail,
      };

      const job = await this.service.create(data);

      res.status(201).json({
        success: true,
        data: job,
      });
    } catch (error) {
      console.error("POST /api/admin/jobs error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create job",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: JobModel = {
        slug: req.body.slug,
        title: req.body.title,
        summary: req.body.summary,
        description: req.body.description,
        requirements: req.body.requirements,
        benefits: req.body.benefits,
        departmentId: req.body.departmentId,
        locationIds: req.body.locationIds,
        workTypeId: req.body.workTypeId,
        salaryId: req.body.salaryId,
        experienceId: req.body.experienceId,
        level: req.body.level,
        languages: req.body.languages,
        status: req.body.status,
        isFeatured: req.body.isFeatured,
        headcount: req.body.headcount,
        contactName: req.body.contactName,
        contactEmail: req.body.contactEmail,
      };

      const job = await this.service.update(id, data);

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      console.error("PATCH /api/admin/jobs/:id error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to update job",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const job = await this.service.delete(id);

      res.json({
        success: true,
        data: { id: job.id, deleted: true },
      });
    } catch (error) {
      console.error("DELETE /api/admin/jobs/:id error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete job",
      });
    }
  }

  async taxonomies(_req: Request, res: Response) {
    try {
      const groups = await this.service.getTaxonomies();

      res.json({
        success: true,
        data: groups,
      });
    } catch (error) {
      console.error("GET /api/admin/jobs/taxonomies error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch taxonomies",
      });
    }
  }
}