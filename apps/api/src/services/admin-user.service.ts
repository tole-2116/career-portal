import bcrypt from "bcryptjs";
import { db } from "@career-portal/database";
import type {
  AdminUserDto,
  AdminUserListQuery,
  AdminUserListResult,
  AdminUserRole,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from "../types/admin-user.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MIN_PASSWORD_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

export const adminUserRoles: readonly AdminUserRole[] = ["ADMIN", "RECRUITER"];

function normalizePage(value: number | undefined): number {
  return Number.isInteger(value) && value && value > 0 ? value : DEFAULT_PAGE;
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

function mapUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  isdelete: boolean;
  created_at: Date;
}): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AdminUserRole,
    // `isdelete` là cờ xoá mềm nên đồng thời là trạng thái khoá tài khoản.
    active: !user.isdelete,
    createdAt: user.created_at.toISOString(),
  };
}

/** Chặn thao tác làm mất quản trị viên active cuối cùng của hệ thống. */
async function assertNotLastActiveAdmin(target: {
  id: string;
  role: AdminUserRole;
  active: boolean;
}): Promise<void> {
  if (target.role !== "ADMIN" || !target.active) return;

  const activeAdmins = await db.user.count({
    where: { role: "ADMIN", isdelete: false },
  });
  if (activeAdmins <= 1) {
    throw new Error("LAST_ACTIVE_ADMIN");
  }
}

export class AdminUserService {
  async findMany(query: AdminUserListQuery = {}): Promise<AdminUserListResult> {
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);
    const where: Record<string, unknown> = {
      isdelete: false,
      role: { in: ["ADMIN", "RECRUITER"] },
    };

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isdelete: true,
          created_at: true,
        },
      }),
      db.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      users: rows.map(mapUser),
      total,
      page: Math.min(page, totalPages),
      totalPages,
    };
  }

  async create(input: CreateAdminUserInput, actorId: string): Promise<AdminUserDto> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const password = input.password;

    if (!email || !email.includes("@")) {
      throw new Error("INVALID_EMAIL");
    }
    if (!name) {
      throw new Error("INVALID_NAME");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error("PASSWORD_TOO_SHORT");
    }
    if (!adminUserRoles.includes(input.role)) {
      throw new Error("INVALID_ROLE");
    }

    const created = await db.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        role: input.role,
        usercreate_at: actorId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isdelete: true,
        created_at: true,
      },
    });

    return mapUser(created);
  }

  async update(
    id: string,
    input: UpdateAdminUserInput,
    actorId: string,
  ): Promise<AdminUserDto> {
    const existing = await db.user.findFirst({
      where: { id, isdelete: false },
      select: { id: true, email: true, name: true, role: true, isdelete: true, created_at: true },
    });
    if (!existing) {
      throw new Error("USER_NOT_FOUND");
    }

    const data: Record<string, unknown> = { userupdated_at: actorId };

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new Error("INVALID_NAME");
      data.name = name;
    }
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (!email || !email.includes("@")) throw new Error("INVALID_EMAIL");
      data.email = email;
    }
    if (input.role !== undefined) {
      if (!adminUserRoles.includes(input.role)) throw new Error("INVALID_ROLE");
      data.role = input.role;
    }
    if (input.password !== undefined) {
      if (input.password.length < MIN_PASSWORD_LENGTH) throw new Error("PASSWORD_TOO_SHORT");
      data.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    }

    const current = mapUser(existing);
    // Hạ quyền hoặc khoá chính quản trị viên active cuối cùng sẽ khoá truy cập toàn hệ thống.
    if (
      (input.role !== undefined && input.role !== "ADMIN" || input.active === false) &&
      current.role === "ADMIN" &&
      current.active
    ) {
      await assertNotLastActiveAdmin(current);
    }
    if (input.active === false) {
      data.isdelete = true;
    }
    if (input.active === true && existing.isdelete) {
      throw new Error("USER_NOT_FOUND");
    }

    try {
      const updated = await db.user.update({ where: { id }, data, select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isdelete: true,
        created_at: true,
      } });
      return mapUser(updated);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        throw new Error("EMAIL_TAKEN");
      }
      throw error;
    }
  }

  async remove(id: string, actorId: string): Promise<void> {
    const existing = await db.user.findFirst({
      where: { id, isdelete: false },
      select: { id: true, email: true, name: true, role: true, isdelete: true, created_at: true },
    });
    if (!existing) {
      throw new Error("USER_NOT_FOUND");
    }
    if (existing.id === actorId) {
      throw new Error("CANNOT_DELETE_SELF");
    }

    const target = mapUser(existing);
    if (target.role === "ADMIN" && target.active) {
      await assertNotLastActiveAdmin(target);
    }

    await db.user.update({
      where: { id },
      data: { isdelete: true, userupdated_at: actorId },
    });
  }
}

export const adminUserService = new AdminUserService();
