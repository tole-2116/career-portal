import { db } from "@career-portal/database";
import type {
  AdminContactDto,
  AdminContactListQuery,
  AdminContactListResult,
} from "../types/admin-contact.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function normalizePage(value: number | undefined): number {
  return Number.isInteger(value) && value && value > 0 ? value : DEFAULT_PAGE;
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

const CONTACT_SELECT = {
  id: true,
  code: true,
  name: true,
  email: true,
  phone: true,
  subject: true,
  body: true,
  created_at: true,
} as const;

type ContactRow = {
  id: string;
  code: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  created_at: Date;
};

function mapContact(contact: ContactRow): AdminContactDto {
  return {
    id: contact.id,
    code: contact.code ?? null,
    name: contact.name,
    email: contact.email,
    phone: contact.phone ?? null,
    subject: contact.subject,
    body: contact.body,
    createdAt: contact.created_at.toISOString(),
  };
}

export class AdminContactService {
  async findMany(query: AdminContactListQuery = {}): Promise<AdminContactListResult> {
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);
    const where: Record<string, unknown> = { isdelete: false };

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      db.contact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: "desc" },
        select: CONTACT_SELECT,
      }),
      db.contact.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      contacts: rows.map(mapContact),
      total,
      page: Math.min(page, totalPages),
      totalPages,
    };
  }

  async findOne(id: string): Promise<AdminContactDto> {
    const existing = await db.contact.findFirst({
      where: { id, isdelete: false },
      select: CONTACT_SELECT,
    });
    if (!existing) {
      throw new Error("CONTACT_NOT_FOUND");
    }
    return mapContact(existing);
  }
}

export const adminContactService = new AdminContactService();
