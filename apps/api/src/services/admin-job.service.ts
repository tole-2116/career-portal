import { db, Prisma } from "@career-portal/database";
import type { JobModel, JobModelQuery, JobStatus, LocaleStringModel } from "../types/job";

// Taxonomy type codes. Seed lưu dạng thường ("department", "workType", "level", "location", "newsCategory"),
// task spec dùng dạng hoa ("DEPARTMENT","LOCATION","LEVEL","NEWSCATEGORY") — so khớp không phân biệt hoa/thường.
const TAXONOMY_TYPE = {
  DEPARTMENT: "department",
  LOCATION: "location",
  NEWSCATEGORY: "newscategory",
  SALARY: "salary",
  EXPERIENCE: "experience",
} as const;

/** Loại hình làm việc: seed lưu `type = "workType"` (full-time, hybrid, remote...). */
const TAXONOMY_TYPE_WORKTYPE = "worktype";

/** Chuẩn hoá type: lowercase, bỏ ký tự đặc biệt. "workType"/"WORKTYPE"/"work-type" -> "worktype". */
function normalizeTaxonomyType(type: string): string {
  return type.toLowerCase().replace(/[^a-z]/g, "");
}

/** Map type đã chuẩn hoá sang key nhóm trả về cho client. */
function toBucketKey(normalizedType: string): "departments" | "locations" | "workTypes" | "salaries" | "experiences" | null {
  switch (normalizedType) {
    case TAXONOMY_TYPE.DEPARTMENT:
      return "departments";
    case TAXONOMY_TYPE.LOCATION:
      return "locations";
    case TAXONOMY_TYPE_WORKTYPE:
      return "workTypes";
    case TAXONOMY_TYPE.SALARY:
      return "salaries";
    case TAXONOMY_TYPE.EXPERIENCE:
      return "experiences";
    default:
      return null;
  }
}

/** Shape Taxonomy gửi ra client. */
export type TaxonomyInfo = {
  id: string;
  code: string;
  type: string;
  label: { vi: string; en: string };
};

/** Cột `Taxonomy.name` là Json — đọc an toàn ra {vi, en}. */
function readName(name: unknown): { vi: string; en: string } {
  if (name && typeof name === "object" && !Array.isArray(name)) {
    const raw = name as { vi?: unknown; en?: unknown };
    return {
      vi: typeof raw.vi === "string" ? raw.vi : "",
      en: typeof raw.en === "string" ? raw.en : "",
    };
  }
  return { vi: "", en: "" };
}

function toTaxonomyInfo(row: { id: string; code: string; type: string; name: unknown }): TaxonomyInfo {
  return { id: row.id, code: row.code, type: row.type, label: readName(row.name) };
}

/** Tách locationIds (mảng hoặc chuỗi "id1,id2") thành danh sách ID sạch. */
function splitIds(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Xác thực taxonomy ID: kiểm tra tồn tại + đúng type.
 * Trả về trực tiếp `taxonomy.id`. Ném lỗi nếu không tồn tại hoặc sai type.
 */
async function assertValidTaxonomyId(
  taxonomyId: string,
  expectedType: "department" | "location" | "workType" | "salary" | "experience",
  fieldName: string,
): Promise<string> {
  const tax = await db.taxonomy.findFirst({ where: { id: taxonomyId } });

  if (!tax) {
    throw new Error(`Invalid ${fieldName}: Taxonomy with id "${taxonomyId}" not found`);
  }

  if (normalizeTaxonomyType(tax.type) !== normalizeTaxonomyType(expectedType)) {
    throw new Error(
      `Invalid ${fieldName}: Taxonomy with id "${taxonomyId}" has type "${tax.type}", expected "${expectedType}"`,
    );
  }

  return tax.id;
}

/**
 * Gom taxonomy ID từ danh sách job rồi truy vấn 1 lần, map id -> TaxonomyInfo.
 * Trả về Map rỗng nếu không có ID nào.
 */
async function loadTaxonomyMap(
  ids: Iterable<string | null | undefined>,
): Promise<Map<string, TaxonomyInfo>> {
  const unique = Array.from(new Set(Array.from(ids).filter((id): id is string => Boolean(id))));

  const map = new Map<string, TaxonomyInfo>();
  if (unique.length === 0) return map;

  const rows = await db.taxonomy.findMany({ where: { id: { in: unique } } });
  for (const row of rows) {
    map.set(row.id, toTaxonomyInfo(row));
  }

  return map;
}

/** Chuyển LocaleStringModel sang object {en, vi} cho Prisma Json field. */
function toLocalizedObj(locale: LocaleStringModel): { en: string; vi: string } {
  return {
    en: locale.en,
    vi: locale.vi ?? locale.en,
  };
}

/** Chuẩn hoá một field đa ngữ về JSON nullable { en, vi }. */
function formatLocalizedField(value: unknown): { en: string; vi: string } | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;

  if (typeof value === "string") {
    const text = value.trim();
    return text ? { en: text, vi: text } : Prisma.JsonNull;
  }

  if (Array.isArray(value)) {
    const items = value
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        en: typeof item.en === "string" ? item.en.trim() : "",
        vi: typeof item.vi === "string" ? item.vi.trim() : "",
      }))
      .filter((item) => item.en || item.vi);
    if (!items.length) return Prisma.JsonNull;
    return {
      en: items.map((item) => item.en || item.vi).join("\\n"),
      vi: items.map((item) => item.vi || item.en).join("\\n"),
    };
  }

  if (typeof value === "object") {
    const item = value as { en?: unknown; vi?: unknown };
    const en = typeof item.en === "string" ? item.en.trim() : "";
    const vi = typeof item.vi === "string" ? item.vi.trim() : "";
    return en || vi ? { en: en || vi, vi: vi || en } : Prisma.JsonNull;
  }

  return Prisma.JsonNull;
}

function normalizeHeadcount(value: number | string | null | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

/** Slugify để sinh slug khi client không truyền (cột `Job.slug` là @unique). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Ba cột trên Job lưu trực tiếp `Taxonomy.id`. */
type JobTaxonomyColumns = {
  departmentId: string | null;
  locationIds: string | null;
  workTypeId: string | null;
  salaryId: string | null;
  experienceId: string | null;
};

/** Gắn taxonomy info, hỗ trợ nhiều location ID nối bằng dấu phẩy. */
async function withTaxonomyInfo<T extends JobTaxonomyColumns>(job: T) {
  const locationIds = splitIds(job.locationIds);
  const taxMap = await loadTaxonomyMap([
    job.departmentId,
    ...locationIds,
    job.workTypeId,
    job.salaryId,
    job.experienceId,
  ]);

  const departmentId = job.departmentId ?? undefined;
  const workTypeId = job.workTypeId ?? undefined;
  const salaryId = job.salaryId ?? undefined;
  const experienceId = job.experienceId ?? undefined;
  const locationsInfo = locationIds
    .map((id) => taxMap.get(id))
    .filter((value): value is TaxonomyInfo => Boolean(value));

  return {
    ...job,
    departmentId,
    locationIds: locationIds.join(",") || undefined,
    workTypeId,
    salaryId,
    experienceId,
    departmentInfo: departmentId ? taxMap.get(departmentId) : undefined,
    locationInfo: locationsInfo[0],
    locationsInfo,
    workTypeInfo: workTypeId ? taxMap.get(workTypeId) : undefined,
    salaryInfo: salaryId ? taxMap.get(salaryId) : undefined,
    experienceInfo: experienceId ? taxMap.get(experienceId) : undefined,
  };
}

export class AdminJobService {
  async findMany(query: JobModelQuery = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    // `db` extension tự thêm isdelete:false cho findMany/findFirst nhưng KHÔNG cho count
    // — thêm thủ công để count khớp với danh sách.
    const where: Record<string, unknown> = { isdelete: false };

    if (query.status) {
      where.status = query.status;
    }

    if (query.departmentId) {
      where.departmentId = await assertValidTaxonomyId(
        query.departmentId,
        "department",
        "departmentId",
      );
    }

    if (query.locationIds) {
      // locationIds lưu nhiều id nối bằng dấu phẩy -> lọc bằng contains trên chuỗi.
      where.locationIds = { contains: query.locationIds };
    }

    if (query.workTypeId) {
      where.workTypeId = await assertValidTaxonomyId(query.workTypeId, "workType", "workTypeId");
    }

    if (query.salaryId) {
      where.salaryId = await assertValidTaxonomyId(query.salaryId, "salary", "salaryId");
    }

    if (query.experienceId) {
      where.experienceId = await assertValidTaxonomyId(query.experienceId, "experience", "experienceId");
    }

    if (query.search) {
      // title/description là cột JSON ({en, vi}) — Prisma tìm trên Json cần `path` + `string_contains`.
      where.OR = [
        { slug: { contains: query.search, mode: "insensitive" } },
        { title: { path: ["en"], string_contains: query.search } },
        { title: { path: ["vi"], string_contains: query.search } },
        { description: { path: ["en"], string_contains: query.search } },
        { description: { path: ["vi"], string_contains: query.search } },
      ];
    }

    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { posted: "desc" },
      }),
      db.job.count({ where }),
    ]);

    // Gom toàn bộ taxonomy ID của trang kết quả rồi truy vấn 1 lần.
    const taxMap = await loadTaxonomyMap(
      jobs.flatMap((job) => [job.departmentId, ...splitIds(job.locationIds), job.workTypeId, job.salaryId, job.experienceId]),
    );

    const formattedJobs = jobs.map((job) => {
      const departmentId = job.departmentId ?? undefined;
      const workTypeId = job.workTypeId ?? undefined;
      const salaryId = job.salaryId ?? undefined;
      const experienceId = job.experienceId ?? undefined;
      const locationIds = splitIds(job.locationIds);
      const locationsInfo = locationIds
        .map((id) => taxMap.get(id))
        .filter((value): value is TaxonomyInfo => Boolean(value));

      return {
        ...job,
        departmentId,
        locationIds: locationIds.join(",") || undefined,
        workTypeId,
        salaryId,
        experienceId,
        departmentInfo: departmentId ? taxMap.get(departmentId) : undefined,
        locationInfo: locationsInfo[0],
        locationsInfo,
        workTypeInfo: workTypeId ? taxMap.get(workTypeId) : undefined,
        salaryInfo: salaryId ? taxMap.get(salaryId) : undefined,
        experienceInfo: experienceId ? taxMap.get(experienceId) : undefined,
      };
    });

    return {
      jobs: formattedJobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    // findUnique không qua extension — dùng findFirst để extension tự lọc isdelete.
    const job = await db.job.findFirst({
      where: { id },
    });

    if (!job) {
      return null;
    }

    return withTaxonomyInfo(job);
  }

  async create(data: JobModel) {
    // Xác thực ID rồi gán trực tiếp vào 3 cột trên bảng Job.
    const departmentId = data.departmentId
      ? await assertValidTaxonomyId(data.departmentId, "department", "departmentId")
      : undefined;
    const locationIds = splitIds(data.locationIds);
    for (const id of locationIds) {
      await assertValidTaxonomyId(id, "location", "locationIds");
    }
    const locationIdsStr = locationIds.length ? locationIds.join(",") : undefined;
    const workTypeId = data.workTypeId
      ? await assertValidTaxonomyId(data.workTypeId, "workType", "workTypeId")
      : undefined;
    const salaryId = data.salaryId
      ? await assertValidTaxonomyId(data.salaryId, "salary", "salaryId")
      : undefined;
    const experienceId = data.experienceId
      ? await assertValidTaxonomyId(data.experienceId, "experience", "experienceId")
      : undefined;

    const job = await db.job.create({
      data: {
        slug: data.slug ?? slugify(data.title.en),
        title: toLocalizedObj(data.title),
        ...(data.summary && { summary: toLocalizedObj(data.summary) }),
        description: formatLocalizedField(data.description),
        requirements: formatLocalizedField(data.requirements),
        benefits: formatLocalizedField(data.benefits),
        level: data.level ? toLocalizedObj(typeof data.level === "string" ? { en: data.level, vi: data.level } : data.level) : Prisma.JsonNull,
        languages: data.languages ? toLocalizedObj(typeof data.languages === "string" ? { en: data.languages, vi: data.languages } : data.languages) : Prisma.JsonNull,
        applicants: 0,
        featured: data.isFeatured ?? false,
        headcount: normalizeHeadcount(data.headcount),
        contactName: data.contactName?.trim() || null,
        contactEmail: data.contactEmail?.trim() || null,
        status: data.status ?? "DRAFT",
        posted: new Date(),
        ...(departmentId !== undefined && { departmentId }),
        ...(locationIdsStr !== undefined && { locationIds: locationIdsStr }),
        ...(workTypeId !== undefined && { workTypeId }),
        ...(salaryId !== undefined && { salaryId }),
        ...(experienceId !== undefined && { experienceId }),
      },
    });

    return withTaxonomyInfo(job);
  }

  async update(id: string, data: JobModel) {
    const departmentId = data.departmentId
      ? await assertValidTaxonomyId(data.departmentId, "department", "departmentId")
      : undefined;
    const locationIds = splitIds(data.locationIds);
    for (const id of locationIds) {
      await assertValidTaxonomyId(id, "location", "locationIds");
    }
    const locationIdsStr = locationIds.length ? locationIds.join(",") : undefined;
    const workTypeId = data.workTypeId
      ? await assertValidTaxonomyId(data.workTypeId, "workType", "workTypeId")
      : undefined;
    const salaryId = data.salaryId
      ? await assertValidTaxonomyId(data.salaryId, "salary", "salaryId")
      : undefined;
    const experienceId = data.experienceId
      ? await assertValidTaxonomyId(data.experienceId, "experience", "experienceId")
      : undefined;

    const updateData: Record<string, unknown> = {
      ...(data.title && { title: toLocalizedObj(data.title) }),
      ...(data.summary && { summary: toLocalizedObj(data.summary) }),
      ...(data.description !== undefined && { description: formatLocalizedField(data.description) }),
      ...(data.requirements !== undefined && { requirements: formatLocalizedField(data.requirements) }),
      ...(data.benefits !== undefined && { benefits: formatLocalizedField(data.benefits) }),
      ...(data.status && { status: data.status }),
      ...(data.isFeatured !== undefined && { featured: data.isFeatured }),
      ...(data.headcount !== undefined && { headcount: normalizeHeadcount(data.headcount) }),
      ...(data.contactName !== undefined && { contactName: data.contactName?.trim() || null }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail?.trim() || null }),
      ...(data.level !== undefined && {
        level: data.level === null ? Prisma.JsonNull : toLocalizedObj(typeof data.level === "string" ? { en: data.level, vi: data.level } : data.level),
      }),
      ...(data.languages !== undefined && {
        languages: data.languages === null ? Prisma.JsonNull : toLocalizedObj(typeof data.languages === "string" ? { en: data.languages, vi: data.languages } : data.languages),
      }),
      ...(departmentId && { departmentId }),
      ...(data.locationIds !== undefined && { locationIds: locationIdsStr || null }),
      ...(workTypeId && { workTypeId }),
      ...(salaryId && { salaryId }),
      ...(experienceId && { experienceId }),
    };

    const job = await db.job.update({
      where: { id },
      data: updateData,
    });

    return withTaxonomyInfo(job);
  }

  /** Cập nhật trạng thái hiển thị của job (DRAFT/OPEN/PAUSED/EXPIRED/CLOSED). */
  async changeStatus(id: string, status: JobStatus) {
    const job = await db.job.update({
      where: { id },
      data: { status },
    });

    return withTaxonomyInfo(job);
  }

  /** Xoá mềm: set isdelete=true để giữ lại lịch sử ứng viên (Candidate FK -> Job). */
  async delete(id: string) {
    return db.job.update({
      where: { id },
      data: { isdelete: true, userupdated_at: "system_delete" },
    });
  }

  /**
   * Danh mục cho form Job: gom theo `departments` / `locations` / `workTypes` / `salaries` / `experiences`,
   * trả về { id, code, type, label } để client gửi đúng `id` khi submit.
   */
  async getTaxonomies() {
    const rows = await db.taxonomy.findMany();

    const groups: Record<string, TaxonomyInfo[]> = {
      departments: [],
      locations: [],
      workTypes: [],
      salaries: [],
      experiences: [],
    };

    for (const row of rows) {
      const key = toBucketKey(normalizeTaxonomyType(row.type));
      if (!key) continue;
      groups[key].push(toTaxonomyInfo(row));
    }

    return groups;
  }
}