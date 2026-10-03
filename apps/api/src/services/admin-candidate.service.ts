import { db } from "@career-portal/database";
import type {
  AdminCandidateFilterQuery,
  AdminCandidateListItem,
  AdminCandidateLocalizedText,
  AdminCandidatePaginatedResponse,
  AdminCandidateStatus,
  AdminCandidateUpdatePayload,
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
  address: string | null;
  jobId: string;
  status: AdminCandidateStatus;
  rating: number | null;
  appliedAt: Date;
  cvFile: string | null;
  experienceId: string | null;
  experienceYears: number;
  formData: unknown;
  notes: string | null;
  job: { title: unknown } | null;
  experienceTaxonomy: { name: unknown; type: string } | null;
}): AdminCandidateListItem {
  const taxonomyExperience = readLocalized(candidate.experienceTaxonomy?.name);
  const experience = taxonomyExperience.vi || taxonomyExperience.en
    ? taxonomyExperience
    : candidate.experienceYears
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
    address: candidate.address,
    jobId: candidate.jobId,
    jobTitle: readLocalized(candidate.job?.title),
    status: candidate.status,
    rating: candidate.rating ?? 0,
    appliedAt: candidate.appliedAt.toISOString(),
    cvFile: candidate.cvFile ?? "",
    experienceId: candidate.experienceId,
    location: readFormLocation(candidate.formData),
    experience,
    highlights: [],
    notes: readNotes(candidate.notes),
  };
}

export class AdminCandidateService {
  async findExperienceTaxonomies() {
    const rows = await db.taxonomy.findMany({
      where: { type: "experience", isdelete: false },
      orderBy: { code: "asc" },
      select: { id: true, code: true, type: true, name: true },
    });
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      type: row.type,
      label: readLocalized(row.name),
    }));
  }

  async findMany(
    query: AdminCandidateFilterQuery = {},
  ): Promise<AdminCandidatePaginatedResponse> {
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { isdelete: false };

    if (query.jobId?.trim()) where.jobId = query.jobId.trim();
    if (query.experienceId?.trim()) where.experienceId = query.experienceId.trim();
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
        include: {
          job: { select: { title: true } },
          experienceTaxonomy: { select: { name: true, type: true } },
        },
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
      include: {
        job: { select: { title: true } },
        experienceTaxonomy: { select: { name: true, type: true } },
      },
    });

    return mapCandidate(updated);
  }

  async update(id: string, payload: AdminCandidateUpdatePayload): Promise<AdminCandidateListItem> {
    if (!candidateStatuses.includes(payload.status)) {
      throw new Error(`Invalid status: ${payload.status}`);
    }

    const job = await db.job.findFirst({
      where: { id: payload.jobId },
      select: { id: true },
    });
    if (!job) throw new Error(`Invalid jobId: ${payload.jobId}`);

    const updated = await db.candidate.update({
      where: { id, isdelete: false },
      data: {
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        address: payload.address?.trim().slice(0, 500) || null,
        cvFile: payload.cvFile.trim(),
        jobId: payload.jobId,
        status: payload.status,
        notes: payload.notes.trim() || null,
      },
      include: {
        job: { select: { title: true } },
        experienceTaxonomy: { select: { name: true, type: true } },
      },
    });

    return mapCandidate(updated);
  }
}

export const adminCandidateService = new AdminCandidateService();
