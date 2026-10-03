/**
 * Client gọi REST API cho Admin Candidates — tương thích với backend
 * `@career-portal/api` (`GET /api/admin/candidates`).
 *
 * Backend trả shape Prisma Candidate: `status` là enum HOA (NEW/SCREENING/...),
 * `jobTitle` là JSON {en, vi}, các field nullable mapped an toàn.
 * Frontend `Candidate` dùng `stage` THƯỜNG (new/screening/...) và `jobTitle` localized,
 * nên module này chịu trách nhiệm map hai chiều.
 */

import type { Candidate, Stage } from "@/data/candidates";
import type { Localized } from "@/lib/i18n";

const API_BASE = "/api/admin/candidates";

/* ---------- Kiểu backend ---------- */

export type ApiCandidateStatus = "NEW" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";

interface ApiLocalizedText {
  vi: string;
  en: string;
}

interface ApiCandidate {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: ApiLocalizedText;
  status: ApiCandidateStatus;
  rating: number;
  appliedAt: string;
  cvFile: string;
  experienceId: string | null;
  location: ApiLocalizedText;
  experience: ApiLocalizedText;
  highlights: ApiLocalizedText[];
  notes: Array<{ author: string; at: string; body: ApiLocalizedText }>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

/* ---------- status mapping ---------- */

const API_TO_UI: Record<ApiCandidateStatus, Stage> = {
  NEW: "new",
  SCREENING: "screening",
  INTERVIEW: "interview",
  OFFER: "offer",
  HIRED: "hired",
  REJECTED: "rejected",
};

const UI_TO_API: Record<Stage, ApiCandidateStatus> = {
  new: "NEW",
  screening: "SCREENING",
  interview: "INTERVIEW",
  offer: "OFFER",
  hired: "HIRED",
  rejected: "REJECTED",
};

/* ---------- helpers ---------- */

const emptyLocalized: Localized = { vi: "", en: "" };

function asLocalized(value: ApiLocalizedText | undefined): Localized {
  if (!value) return { ...emptyLocalized };
  return { vi: value.vi || "", en: value.en || "" };
}

function toDateString(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function mapApiCandidate(raw: ApiCandidate): Candidate {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    location: asLocalized(raw.location),
    jobId: raw.jobId,
    jobTitle: asLocalized(raw.jobTitle),
    stage: API_TO_UI[raw.status] ?? "new",
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    appliedAt: toDateString(raw.appliedAt),
    cvFile: raw.cvFile || "",
    experienceId: raw.experienceId ?? null,
    experience: asLocalized(raw.experience),
    highlights: (raw.highlights ?? []).map(asLocalized),
    notes: (raw.notes ?? []).map((note) => ({
      author: note.author || "",
      at: note.at || "",
      body: asLocalized(note.body),
    })),
  };
}

/** Fetch wrapper: unwrap `{ success, data }`, ném lỗi kèm message từ backend. */
async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Không phải JSON (lỗi proxy/mạng) — dùng thông báo chung bên dưới.
  }

  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}`);
  }
  if (body && body.success === false) {
    throw new Error(body.error || "Request failed");
  }
  return body?.data as T;
}

/* ---------- Public API ---------- */

export interface CandidateListParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  /** Canonical UI status filter. */
  status?: Stage | undefined;
  /** Backward-compatible alias for callers using the old name. */
  stage?: Stage | undefined;
  jobId?: string | undefined;
  experienceId?: string | undefined;
  search?: string | undefined;
}

export interface CandidateListResult {
  candidates: Candidate[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CandidateUpdatePayload {
  name: string;
  email: string;
  phone: string;
  cvFile: string;
  jobId: string;
  status: Stage;
  notes: string;
}

/** GET /api/admin/candidates — danh sách ứng viên (phân trang, lọc, tìm kiếm). */
export interface CandidateExperienceTaxonomy {
  id: string;
  code: string;
  type: string;
  label: ApiLocalizedText;
}

async function getExperienceTaxonomies(): Promise<CandidateExperienceTaxonomy[]> {
  const result = await request<{ experiences: CandidateExperienceTaxonomy[] }>(`${API_BASE}/taxonomies`);
  return result?.experiences ?? [];
}

async function getCandidates(params: CandidateListParams = {}): Promise<CandidateListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("limit", String(params.pageSize));
  const status = params.status ?? params.stage;
  if (status) query.set("status", UI_TO_API[status]);
  if (params.jobId) query.set("jobId", params.jobId);
  if (params.experienceId) query.set("experienceId", params.experienceId);
  if (params.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await request<{
    candidates: ApiCandidate[];
    total: number;
    page: number;
    totalPages: number;
  }>(`${API_BASE}${suffix}`);

  return {
    candidates: (result?.candidates ?? []).map(mapApiCandidate),
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    totalPages: result?.totalPages ?? 1,
  };
}

/** PATCH /api/admin/candidates/:id/status — lưu giai đoạn tuyển dụng. */
async function updateStatus(id: string, status: Stage): Promise<Candidate> {
  const raw = await request<ApiCandidate>(`${API_BASE}/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: UI_TO_API[status] }),
  });
  return mapApiCandidate(raw);
}

/** PUT /api/admin/candidates/:id — cập nhật hồ sơ ứng viên. */
async function updateCandidate(id: string, payload: CandidateUpdatePayload): Promise<Candidate> {
  const raw = await request<ApiCandidate>(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      ...payload,
      status: UI_TO_API[payload.status],
    }),
  });
  return mapApiCandidate(raw);
}

export const adminCandidateApi = {
  getCandidates,
  getExperienceTaxonomies,
  updateStatus,
  updateCandidate,
};
