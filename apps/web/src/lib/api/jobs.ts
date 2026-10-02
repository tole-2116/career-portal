/**
 * Client gọi REST API cho Job — tương thích với backend `@career-portal/api`
 * (`GET/POST/PUT/DELETE /api/admin/jobs`).
 *
 * Backend trả shape Prisma Job: `status` là enum HOA (OPEN/DRAFT/...), các field
 * đa ngữ là JSON {en, vi}, `departmentId`/`locationIds`/`workTypeId` là taxonomy ID.
 * Frontend `Job` dùng `status` THƯỜNG (open/draft/...) và label dạng `Localized`,
 * nên module này chịu trách nhiệm map hai chiều.
 */

import type { Job, JobStatus } from "@/data/jobs";
import type { Localized } from "@/lib/i18n";

const API_BASE = "/api/admin/jobs";

/* ---------- Kiểu backend ---------- */

export type ApiJobStatus = "DRAFT" | "OPEN" | "PAUSED" | "EXPIRED" | "CLOSED";

type LocalizedInput = { en: string; vi?: string; [key: string]: string | undefined };

/** Payload gửi lên — tương ứng `JobModel` của backend. */
export interface ApiJobPayload {
  slug?: string;
  title: LocalizedInput;
  summary?: LocalizedInput;
  description?: LocalizedInput | null;
  requirements?: LocalizedInput | null;
  benefits?: LocalizedInput | null;
  departmentId?: string;
  locationIds?: string;
  workTypeId?: string;
  salaryId?: string;
  experienceId?: string;
  level?: LocalizedInput | string | null;
  languages?: LocalizedInput | string | null;
  status?: ApiJobStatus;
  isFeatured?: boolean;
  headcount?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
}

/** Shape Taxonomy info do AdminJobService trả về (label {vi, en}). */
export interface ApiTaxonomyInfo {
  id: string;
  code: string;
  type: string;
  label: { vi: string; en: string };
}

/** Shape `Job` thô do Prisma trả về. */
export interface ApiJob {
  id: string;
  slug: string;
  title: unknown;
  summary?: unknown;
  description: unknown;
  requirements: unknown;
  benefits: unknown;
  applicants: number;
  featured: boolean;
  posted: string;
  deadline: string;
  headcount?: number | null;
  experienceId?: string | null;
  experience?: unknown;
  languages?: unknown;
  contactName?: string | null;
  contactEmail?: string | null;
  status: ApiJobStatus;
  departmentId?: string | null;
  locationIds?: string | null;
  workTypeId?: string | null;
  salaryId?: string | null;
  level?: unknown;
  /** Legacy aliases kept for records returned by older API versions. */
  department?: string | null;
  location?: string | null;
  type?: string | null;
  departmentInfo?: ApiTaxonomyInfo | null;
  locationInfo?: ApiTaxonomyInfo | null;
  locationsInfo?: ApiTaxonomyInfo[];
  workTypeInfo?: ApiTaxonomyInfo | null;
  salaryInfo?: ApiTaxonomyInfo | null;
  experienceInfo?: ApiTaxonomyInfo | null;
}

/** Envelope `{ success, data }` do AdminJobController trả về. */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

/* ---------- status ---------- */

const API_TO_UI: Record<ApiJobStatus, JobStatus> = {
  DRAFT: "draft",
  OPEN: "open",
  PAUSED: "paused",
  EXPIRED: "expired",
  CLOSED: "closed",
};

const UI_TO_API: Record<JobStatus, ApiJobStatus> = {
  draft: "DRAFT",
  open: "OPEN",
  paused: "PAUSED",
  expired: "EXPIRED",
  closed: "CLOSED",
};

/* ---------- helpers ---------- */

const emptyLocalized: Localized = { vi: "", en: "" };

function asLocalized(value: unknown): Localized {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Partial<Localized>;
    return { vi: typeof v.vi === "string" ? v.vi : "", en: typeof v.en === "string" ? v.en : "" };
  }
  return { ...emptyLocalized };
}

/** Chuẩn hoá JSON đa ngữ thành một Localized; legacy arrays được nối bằng xuống dòng. */
function asLocalizedContent(value: unknown): Localized | null {
  if (Array.isArray(value)) {
    const items = value.map(asLocalized).filter((item) => item.vi || item.en);
    if (!items.length) return null;
    return {
      vi: items.map((item) => item.vi || item.en).join("\n"),
      en: items.map((item) => item.en || item.vi).join("\n"),
    };
  }
  if (typeof value === "string") {
    const text = value.trim();
    return text ? { vi: text, en: text } : null;
  }
  const item = asLocalized(value);
  return item.vi || item.en ? item : null;
}

/** Ngày ISO (Prisma DateTime) -> "yyyy-mm-dd" cho <Input type="date">. */
function toDateString(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** Map ApiJob -> Job (frontend). */
function mapApiJob(raw: ApiJob): Job {
  // Fallback: column -> legacy alias -> info object id (for mixed/older API shapes).
  const departmentId = raw.departmentId ?? raw.department ?? raw.departmentInfo?.id ?? undefined;
  const locationIdsValue = raw.locationIds ?? raw.location ?? raw.locationInfo?.id ?? undefined;
  const locationIds = raw.locationsInfo?.map((location) => location.id) ??
    (locationIdsValue ? locationIdsValue.split(",").map((id) => id.trim()).filter(Boolean) : []);
  const workTypeId = raw.workTypeId ?? raw.type ?? raw.workTypeInfo?.id ?? undefined;
  const salaryId = raw.salaryId ?? raw.salaryInfo?.id ?? undefined;
  const experienceId = raw.experienceId ?? raw.experienceInfo?.id ?? undefined;

  return {
    id: raw.id,
    title: asLocalized(raw.title),
    summary: asLocalized(raw.summary),
    departmentId,
    department: raw.departmentInfo?.label ?? emptyLocalized,
    locationIds: locationIds.length ? locationIds : undefined,
    locations: raw.locationsInfo?.length
      ? raw.locationsInfo.map((location) => location.label)
      : raw.locationInfo
        ? [raw.locationInfo.label]
        : [],
    workTypeId,
    workType: raw.workTypeInfo?.label ?? emptyLocalized,
    salaryId,
    salary: raw.salaryInfo?.label ?? emptyLocalized,
    level: asLocalized(raw.level),
    posted: toDateString(raw.posted),
    deadline: toDateString(raw.deadline),
    status: API_TO_UI[raw.status] ?? "draft",
    applicants: typeof raw.applicants === "number" ? raw.applicants : 0,
    featured: raw.featured === true,
    description: asLocalizedContent(raw.description),
    requirements: asLocalizedContent(raw.requirements),
    benefits: asLocalizedContent(raw.benefits),
    extraFields: [],
    headcount: typeof raw.headcount === "number" ? raw.headcount : undefined,
    experienceId: experienceId,
    experience: raw.experienceInfo?.label ?? (raw.experience ? asLocalized(raw.experience) : undefined),
    languages: raw.languages ? asLocalized(raw.languages) : undefined,
    contactName: raw.contactName ?? undefined,
    contactEmail: raw.contactEmail ?? undefined,
  };
}

/** Gửi lên API: nội dung rỗng -> null để backend xóa field; ngược lại gửi {en, vi}. */
function toLocalizedPayload(value: Localized | null | undefined): LocalizedInput | null {
  const en = value?.en?.trim() ?? "";
  const vi = value?.vi?.trim() ?? "";
  if (!en && !vi) return null;
  return { en: en || vi, vi: vi || en };
}

/** Map Job (frontend) -> JobModel (payload backend). */
export function toApiPayload(job: Job, statusOverride?: JobStatus): ApiJobPayload {
  const payload: ApiJobPayload = {
    title: { en: job.title.en, vi: job.title.vi },
    summary: { en: job.summary.en, vi: job.summary.vi },
    description: toLocalizedPayload(job.description),
    requirements: toLocalizedPayload(job.requirements),
    benefits: toLocalizedPayload(job.benefits),
    status: UI_TO_API[statusOverride ?? job.status],
    isFeatured: job.featured,
  };

  // Không gửi slug: backend tự slugify từ title.en (id của Prisma không phải slug).
  if (job.departmentId) payload.departmentId = job.departmentId;
  const locationIds = (job.locationIds ?? []).map((id) => id.trim()).filter(Boolean);
  // Gửi chuỗi rỗng khi bỏ chọn toàn bộ để backend xóa locationIds cũ lúc update.
  payload.locationIds = locationIds.join(",");
  if (job.workTypeId) payload.workTypeId = job.workTypeId;
  if (job.salaryId) payload.salaryId = job.salaryId;
  if (job.experienceId) payload.experienceId = job.experienceId;
  const hasLevel = Boolean(job.level.vi?.trim() || job.level.en?.trim());
  payload.level = hasLevel ? { en: job.level.en, vi: job.level.vi } : null;
  const languageValue = job.languages;
  payload.languages = languageValue?.vi?.trim() || languageValue?.en?.trim()
    ? { en: languageValue.en, vi: languageValue.vi }
    : null;
  // Gửi explicit null khi ô trống để backend lưu/clear DB; không đặt default headcount.
  payload.headcount = typeof job.headcount === "number" && Number.isFinite(job.headcount) ? job.headcount : null;
  payload.contactName = job.contactName?.trim() || null;
  payload.contactEmail = job.contactEmail?.trim() || null;

  return payload;
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

export interface JobListParams {
  page?: number | undefined;
  limit?: number | undefined;
  status?: JobStatus | undefined;
  departmentId?: string | undefined;
  locationIds?: string | undefined;
  workTypeId?: string | undefined;
  salaryId?: string | undefined;
  experienceId?: string | undefined;
  search?: string | undefined;
}

export interface JobListResult {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
}

/** GET /api/admin/jobs — danh sách jobs (phân trang, lọc, tìm kiếm). */
export async function fetchJobs(params: JobListParams = {}): Promise<JobListResult> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", UI_TO_API[params.status]);
  if (params.departmentId) query.set("departmentId", params.departmentId);
  if (params.locationIds) query.set("locationIds", params.locationIds);
  if (params.workTypeId) query.set("workTypeId", params.workTypeId);
  if (params.salaryId) query.set("salaryId", params.salaryId);
  if (params.experienceId) query.set("experienceId", params.experienceId);
  if (params.search) query.set("search", params.search);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const result = await request<{
    jobs: ApiJob[];
    total: number;
    page: number;
    totalPages: number;
  }>(`${API_BASE}${suffix}`);

  return {
    jobs: (result?.jobs ?? []).map(mapApiJob),
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    totalPages: result?.totalPages ?? 1,
  };
}

/** POST /api/admin/jobs — tạo job mới. */
export async function createJob(payload: ApiJobPayload): Promise<Job> {
  const raw = await request<ApiJob>(API_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapApiJob(raw);
}

/** PUT /api/admin/jobs/:id — cập nhật job. */
export async function updateJob(id: string, payload: ApiJobPayload): Promise<Job> {
  const raw = await request<ApiJob>(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapApiJob(raw);
}

/** GET /api/admin/jobs/taxonomies — taxonomy options dùng ID thực từ database. */
export async function fetchJobTaxonomies(): Promise<{
  departments: ApiTaxonomyInfo[];
  locations: ApiTaxonomyInfo[];
  workTypes: ApiTaxonomyInfo[];
  salaries: ApiTaxonomyInfo[];
  experiences: ApiTaxonomyInfo[];
}> {
  return request(`${API_BASE}/taxonomies`);
}

/** DELETE /api/admin/jobs/:id — xoá job. */
export async function deleteJob(id: string): Promise<void> {
  await request<unknown>(`${API_BASE}/${id}`, { method: "DELETE" });
}
