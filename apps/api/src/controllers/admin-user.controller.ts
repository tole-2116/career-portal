import type { Request, Response } from "express";
import { adminUserRoles, adminUserService } from "../services/admin-user.service";
import type {
  AdminUserListQuery,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "../types/admin-user.types";

function parsePositiveInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${field} must be a positive integer`);
  return parsed;
}

function statusFor(error: unknown): number {
  const message = error instanceof Error ? error.message : "";
  if (["USER_NOT_FOUND"].includes(message)) return 404;
  if (["EMAIL_TAKEN", "LAST_ACTIVE_ADMIN", "CANNOT_DELETE_SELF"].includes(message)) return 409;
  if (message.includes("must be a positive integer") || [
    "INVALID_EMAIL", "INVALID_NAME", "PASSWORD_TOO_SHORT", "INVALID_ROLE",
  ].includes(message)) return 400;
  return 500;
}

function messageFor(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    INVALID_EMAIL: "A valid email is required",
    INVALID_NAME: "A display name is required",
    PASSWORD_TOO_SHORT: "Password must be at least 6 characters",
    INVALID_ROLE: "Invalid user role",
    EMAIL_TAKEN: "Email is already in use",
    USER_NOT_FOUND: "User not found",
    LAST_ACTIVE_ADMIN: "At least one active administrator is required",
    CANNOT_DELETE_SELF: "You cannot delete your own account",
  };
  return messages[message] || message || "Request failed";
}

export class AdminUserController {
  constructor() {
    this.getPaginated = this.getPaginated.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  async getPaginated(req: Request, res: Response) {
    try {
      const query: AdminUserListQuery = {
        page: parsePositiveInteger(req.query.page, "page"),
        limit: parsePositiveInteger(req.query.limit, "limit"),
        search: typeof req.query.search === "string" ? req.query.search : undefined,
      };
      const result = await adminUserService.findMany(query);
      return res.json({ success: true, data: result, meta: result });
    } catch (error) {
      console.error("GET /api/admin/users error:", error);
      return res.status(statusFor(error)).json({ success: false, error: messageFor(error) });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const body = (req.body ?? {}) as Partial<CreateAdminUserInput>;
      if (typeof body.email !== "string" || typeof body.name !== "string" || typeof body.password !== "string") {
        return res.status(400).json({ success: false, error: "Email, name and password are required" });
      }
      if (typeof body.role !== "string" || !adminUserRoles.includes(body.role as CreateAdminUserInput["role"])) {
        return res.status(400).json({ success: false, error: "Invalid user role" });
      }
      const result = await adminUserService.create({
        email: body.email,
        name: body.name,
        password: body.password,
        role: body.role as CreateAdminUserInput["role"],
      }, req.user?.id ?? "");
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error("POST /api/admin/users error:", error);
      return res.status(statusFor(error)).json({ success: false, error: messageFor(error) });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const body = (req.body ?? {}) as UpdateAdminUserInput;
      if (body.role !== undefined && (typeof body.role !== "string" || !adminUserRoles.includes(body.role as "ADMIN" | "RECRUITER"))) {
        return res.status(400).json({ success: false, error: "Invalid user role" });
      }
      const result = await adminUserService.update(req.params.id, body, req.user?.id ?? "");
      return res.json({ success: true, data: result });
    } catch (error) {
      console.error("PUT /api/admin/users/:id error:", error);
      return res.status(statusFor(error)).json({ success: false, error: messageFor(error) });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await adminUserService.remove(req.params.id, req.user?.id ?? "");
      return res.json({ success: true, data: null });
    } catch (error) {
      console.error("DELETE /api/admin/users/:id error:", error);
      return res.status(statusFor(error)).json({ success: false, error: messageFor(error) });
    }
  }
}

export const adminUserController = new AdminUserController();
