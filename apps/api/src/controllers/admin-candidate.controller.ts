import type { Request, Response } from "express";
import { adminCandidateService } from "../services/admin-candidate.service";
import type {
  AdminCandidateFilterQuery,
  AdminCandidateStatus,
  AdminCandidateStatusPayload,
} from "../types/admin-candidate.types";

const candidateStatuses: readonly AdminCandidateStatus[] = [
  "NEW",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

function parsePositiveInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return parsed;
}

export class AdminCandidateController {
  constructor() {
    this.getPaginated = this.getPaginated.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async getPaginated(req: Request, res: Response) {
    try {
      const rawStatus = req.query.status as string | undefined;
      if (rawStatus && !candidateStatuses.includes(rawStatus as AdminCandidateStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid candidate status: ${rawStatus}`,
        });
      }

      const query: AdminCandidateFilterQuery = {
        page: parsePositiveInteger(req.query.page, "page"),
        limit: parsePositiveInteger(req.query.limit, "limit"),
        status: rawStatus as AdminCandidateStatus | undefined,
        jobId: req.query.jobId as string | undefined,
        search: req.query.search as string | undefined,
      };
      const result = await adminCandidateService.findMany(query);

      return res.json({
        success: true,
        data: result,
        meta: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch candidates";
      if (message.includes("must be a positive integer")) {
        return res.status(400).json({ success: false, error: message });
      }
      console.error("GET /api/admin/candidates error:", error);
      return res.status(500).json({ success: false, error: message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body as Partial<AdminCandidateStatusPayload> | undefined;
      const status = payload?.status;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Missing candidate id",
        });
      }
      if (!status || !candidateStatuses.includes(status as AdminCandidateStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid candidate status: ${status}`,
        });
      }

      const candidate = await adminCandidateService.updateStatus(id, status as AdminCandidateStatus);

      return res.json({ success: true, data: candidate });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update candidate status";
      if (message.startsWith("Invalid status:")) {
        return res.status(400).json({ success: false, error: message });
      }
      // Prisma ném P2025 khi bản ghi không tồn tại hoặc bị xoá mềm.
      if (message.includes("No record was found")) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }
      console.error("PATCH /api/admin/candidates/:id/status error:", error);
      return res.status(500).json({ success: false, error: message });
    }
  }
}

export const adminCandidateController = new AdminCandidateController();
