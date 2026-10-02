import { db } from "@career-portal/database";
import type {
  AdminCandidateFilterQuery,
  AdminCandidateListItem,
  AdminCandidateLocalizedText,
  AdminCandidatePaginatedResponse,
  AdminCandidateStatus,
} from "../types/admin-candidate.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const candidateStatuses: readonly AdminCandidateStatus[] = [
  "NEW",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

function normalizePage(value: number | undefined): number {
  return Number.isInteger(value) && value && value > 0 ? value : DEFAULT_PAGE;
}

function normalizeLimit(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) return DEFAULT_LIMIT;
  return Math.min(value, MAX_LIMIT);
}

function readLocalized(value: unknown): AdminCandidateLocalizedText {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { vi: "", en: "" };
  }
  const raw = value as { vi?: unknown; en?: unknown };
  const en = typeof raw.en === "string" ? raw.en : "";
  const vi = typeof raw.vi === "string" ? raw.vi : "";
  return { vi: vi || en, en: en || vi };
}

function readFormLocation(value: unknown): AdminCandidateLocalizedText {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { vi: "", en: "" };
  }
  const formData = value as { location?: unknown };
  return readLocalized(formData.location);
}

function readNotes(value: string | null): AdminCandidateListItem["notes"] {
  if (!value?.trim()) return [];
  return [{
    author: "",
    at: "",
    body: { vi: value, en: value },
  }];
}

function mapCandidate(candidate: {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  status: AdminCandidateStatus;
  rating: number | null;
  appliedAt: Date;
  resumeUrl: string;
  experienceYears: number;
  formData: unknown;
  notes: string | null;
  job: { title: unknown } | null;
}): AdminCandidateListItem {
  const experience = candidate.experienceYears
    ? {
        vi: `${candidate.experienceYears} năm kinh nghiệm`,
        en: `${candidate.experienceYears} years of experience`,
      }
    : { vi: "", en: "" };

  return {
    id: candidate.id,
    code: candidate.code,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    jobId: candidate.jobId,
    jobTitle: readLocalized(candidate.job?.title),
    status: candidate.status,
    rating: candidate.rating ?? 0,
    appliedAt: candidate.appliedAt.toISOString(),
    cvFile: candidate.resumeUrl,
    location: readFormLocation(candidate.formData),
    experience,
    highlights: [],
    notes: readNotes(candidate.notes),
  };
}

export class AdminCandidateService {
  async findMany(
    query: AdminCandidateFilterQuery = {},
  ): Promise<AdminCandidatePaginatedResponse> {
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { isdelete: false };

    if (query.jobId?.trim()) where.jobId = query.jobId.trim();
    if (query.status && candidateStatuses.includes(query.status)) where.status = query.status;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      db.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: "desc" },
        include: { job: { select: { title: true } } },
      }),
      db.candidate.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);

    return {
      candidates: rows.map(mapCandidate),
      total,
      page: currentPage,
      totalPages,
    };
  }

  async updateStatus(id: string, status: AdminCandidateStatus): Promise<AdminCandidateListItem> {
    if (!candidateStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const updated = await db.candidate.update({
      where: { id, isdelete: false },
      data: { status },
      include: { job: { select: { title: true } } },
    });

    return mapCandidate(updated);
  }
}

export const adminCandidateService = new AdminCandidateService();
