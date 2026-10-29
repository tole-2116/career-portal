import type { Request, Response } from "express";
import { adminContactService } from "../services/admin-contact.service";
import type { AdminContactDto, AdminContactListQuery } from "../types/admin-contact.types";

const CONTACT_STATUSES = ["NEW", "READ", "RESOLVED"] as const;

function parseContactStatus(value: unknown): AdminContactDto["status"] {
  if (typeof value !== "string" || !CONTACT_STATUSES.includes(value as (typeof CONTACT_STATUSES)[number])) {
    throw new Error("INVALID_CONTACT_STATUS");
  }
  return value as AdminContactDto["status"];
}

function parsePositiveInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${field} must be a positive integer`);
  return parsed;
}

function statusFor(error: unknown): number {
  const message = error instanceof Error ? error.message : "";
  if (["CONTACT_NOT_FOUND"].includes(message)) return 404;
  if (message === "INVALID_CONTACT_STATUS" || message.includes("must be a positive integer")) return 400;
  return 500;
}

function messageFor(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    CONTACT_NOT_FOUND: "Contact not found",
    INVALID_CONTACT_STATUS: "Invalid contact status",
  };
  return messages[message] || message || "Request failed";
}

export class AdminContactController {
  constructor() {
    this.getPaginated = this.getPaginated.bind(this);
    this.getOne = this.getOne.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const status = parseContactStatus(req.body?.status);
      const result = await adminContactService.updateStatus(req.params.id, status);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error("PATCH /api/admin/contacts/:id/status error:", error);
      return res.status(statusFor(error)).json({ success: false, error: messageFor(error) });
    }
  }

  async getPaginated(req: Request, res: Response) {
    try {
      const query: AdminContactListQuery = {
        page: parsePositiveInteger(req.query.page, "page"),
        limit: parsePositiveInteger(req.query.limit, "limit"),
        search: typeof req.query.search === "string" ? req.query.search : undefined,
      };
      const result = await adminContactService.findMany(query);
      return res.json({ success: true, data: result, meta: result });
    } catch (error) {
      console.error("GET /api/admin/contacts error:", error);
      return res.status(statusFor(error)).json({ success: false, error: messageFor(error) });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const result = await adminContactService.findOne(req.params.id);
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error("GET /api/admin/contacts/:id error:", error);
      return res.status(statusFor(error)).json({ success: false, error: messageFor(error) });
    }
  }
}

export const adminContactController = new AdminContactController();
