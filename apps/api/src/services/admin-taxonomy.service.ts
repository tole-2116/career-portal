import { db } from "@career-portal/database";

export type Localized = { vi: string; en: string };
export type TaxonomyType = "department" | "workType" | "salary" | "experience" | "location";
export type TaxonomyItemDto = { id: string; code: string; type: string; label: Localized };
export type CustomGroupDto = { key: string; label: Localized; items: TaxonomyItemDto[] };
export type TaxonomyResult = {
  taxonomies: Record<TaxonomyType, TaxonomyItemDto[]>;
  customGroups: CustomGroupDto[];
};

type DefaultItem = { code: string; label: Localized };

const BUILT_IN_TYPES: TaxonomyType[] = ["department", "workType", "salary", "experience", "location"];
const DEFAULTS: Record<TaxonomyType, DefaultItem[]> = {
  department: [
    { code: "engineering", label: { vi: "Công nghệ", en: "Engineering" } },
    { code: "design", label: { vi: "Thiết kế", en: "Design" } },
    { code: "people", label: { vi: "Nhân sự", en: "People" } },
    { code: "sales", label: { vi: "Kinh doanh", en: "Sales" } },
    { code: "marketing", label: { vi: "Marketing", en: "Marketing" } },
    { code: "operations", label: { vi: "Vận hành", en: "Operations" } },
  ],
  workType: [
    { code: "full-time", label: { vi: "Toàn thời gian", en: "Full-time" } },
    { code: "part-time", label: { vi: "Bán thời gian", en: "Part-time" } },
    { code: "hybrid", label: { vi: "Kết hợp từ xa", en: "Hybrid" } },
    { code: "remote", label: { vi: "Làm việc từ xa", en: "Remote" } },
    { code: "internship", label: { vi: "Thực tập", en: "Internship" } },
    { code: "contract", label: { vi: "Hợp đồng thời vụ", en: "Contract" } },
  ],
  salary: [
    { code: "negotiable", label: { vi: "Thỏa thuận", en: "Negotiable" } },
    { code: "s-10-15", label: { vi: "10 – 15 triệu VNĐ", en: "10 – 15M VND" } },
    { code: "s-15-25", label: { vi: "15 – 25 triệu VNĐ", en: "15 – 25M VND" } },
    { code: "s-25-40", label: { vi: "25 – 40 triệu VNĐ", en: "25 – 40M VND" } },
    { code: "s-40-60", label: { vi: "40 – 60 triệu VNĐ", en: "40 – 60M VND" } },
    { code: "s-60-plus", label: { vi: "Trên 60 triệu VNĐ", en: "Above 60M VND" } },
  ],
  experience: [
    { code: "none", label: { vi: "Chưa yêu cầu kinh nghiệm", en: "No experience required" } },
    { code: "under-1", label: { vi: "Dưới 1 năm", en: "Less than 1 year" } },
    { code: "1-3", label: { vi: "1 – 3 năm", en: "1 – 3 years" } },
    { code: "3-5", label: { vi: "3 – 5 năm", en: "3 – 5 years" } },
    { code: "over-5", label: { vi: "Trên 5 năm", en: "More than 5 years" } },
  ],
  location: [
    { code: "hanoi", label: { vi: "Hà Nội", en: "Hanoi" } },
    { code: "hcmc", label: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" } },
    { code: "danang", label: { vi: "Đà Nẵng", en: "Da Nang" } },
    { code: "remote-vn", label: { vi: "Toàn quốc / Từ xa", en: "Nationwide / Remote" } },
  ],
};

function localized(value: unknown): Localized {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { vi: "", en: "" };
  const raw = value as { vi?: unknown; en?: unknown };
  const vi = typeof raw.vi === "string" ? raw.vi.trim() : "";
  const en = typeof raw.en === "string" ? raw.en.trim() : "";
  return { vi: vi || en, en: en || vi };
}

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "muc-moi";
}

function readItem(raw: { id: string; code: string; type: string; name: unknown }): TaxonomyItemDto {
  // The UI uses the stable taxonomy code as its item id (jobs store references codes).
  return { id: raw.code, code: raw.code, type: raw.type, label: localized(raw.name) };
}

function emptyTaxonomies(): Record<TaxonomyType, TaxonomyItemDto[]> {
  return { department: [], workType: [], salary: [], experience: [], location: [] };
}

export class AdminTaxonomyService {
  async list(): Promise<TaxonomyResult> {
    const rows = await db.taxonomy.findMany({ where: { isdelete: false }, orderBy: { created_at: "asc" } });
    const taxonomies = emptyTaxonomies();
    const groups = new Map<string, CustomGroupDto>();
    for (const row of rows) {
      if (BUILT_IN_TYPES.includes(row.type as TaxonomyType)) {
        taxonomies[row.type as TaxonomyType].push(readItem(row));
        continue;
      }
      if (row.type === "newsCategory") continue;
      const key = row.type.startsWith("custom:") ? row.type.slice(7) : row.type;
      let group = groups.get(key);
      if (!group) {
        group = { key, label: { vi: key, en: key }, items: [] };
        groups.set(key, group);
      }
      if (row.code === "__group__") group.label = localized(row.name);
      else group.items.push(readItem(row));
    }
    return { taxonomies, customGroups: [...groups.values()] };
  }

  async create(type: string, label: Localized): Promise<TaxonomyItemDto> {
    const normalized = localized(label);
    const storedType = BUILT_IN_TYPES.includes(type as TaxonomyType) || type.startsWith("custom:")
      ? type
      : `custom:${type}`;
    const codeBase = slugify(normalized.en || normalized.vi || "muc-moi");
    let code = codeBase;
    let suffix = 2;
    while (await db.taxonomy.findFirst({ where: { code, isdelete: false } })) code = `${codeBase}-${suffix++}`;
    const row = await db.taxonomy.create({ data: { code, type: storedType, name: normalized, slug: `${storedType}-${code}`, usercreate_at: "admin" } });
    return readItem(row);
  }

  private async findActive(idOrCode: string) {
    const row = await db.taxonomy.findFirst({
      where: { isdelete: false, OR: [{ id: idOrCode }, { code: idOrCode }] },
    });
    if (!row) throw new Error("Taxonomy item not found");
    return row;
  }

  async update(id: string, label: Localized): Promise<TaxonomyItemDto> {
    const normalized = localized(label);
    if (!normalized.vi && !normalized.en) throw new Error("label must contain vi or en text");
    const existing = await this.findActive(id);
    const row = await db.taxonomy.update({ where: { id: existing.id }, data: { name: normalized, userupdated_at: "admin" } });
    return readItem(row);
  }

  async move(id: string, direction: -1 | 1): Promise<void> {
    const current = await this.findActive(id);
    const rows = await db.taxonomy.findMany({ where: { type: current.type, isdelete: false }, orderBy: { created_at: "asc" } });
    const index = rows.findIndex((row) => row.id === current.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const other = rows[target]!;
    const currentTime = current.created_at;
    await db.$transaction([
      db.taxonomy.update({ where: { id: current.id }, data: { created_at: other.created_at } }),
      db.taxonomy.update({ where: { id: other.id }, data: { created_at: currentTime } }),
    ]);
  }

  async delete(id: string): Promise<void> {
    const row = await this.findActive(id);
    await db.taxonomy.update({ where: { id: row.id }, data: { isdelete: true, userupdated_at: "admin" } });
  }

  async createGroup(label: Localized): Promise<CustomGroupDto> {
    const normalized = localized(label);
    if (!normalized.vi && !normalized.en) throw new Error("label must contain vi or en text");
    const base = slugify(normalized.en || normalized.vi);
    let key = base;
    let suffix = 2;
    while (await db.taxonomy.findFirst({ where: { type: `custom:${key}`, isdelete: false } })) key = `${base}-${suffix++}`;
    await db.taxonomy.create({ data: { code: "__group__", type: `custom:${key}`, name: normalized, slug: `custom-${key}`, usercreate_at: "admin" } });
    return { key, label: normalized, items: [] };
  }

  async deleteGroup(key: string): Promise<void> {
    await db.taxonomy.updateMany({ where: { type: `custom:${key}`, isdelete: false }, data: { isdelete: true, userupdated_at: "admin" } });
  }

  async reset(): Promise<TaxonomyResult> {
    // Xoá mềm toàn bộ mục built-in (kể cả bản ghi seed cũ) rồi khôi phục giá trị mặc định.
    await db.taxonomy.updateMany({
      where: { type: { in: [...BUILT_IN_TYPES] }, isdelete: false },
      data: { isdelete: true, userupdated_at: "admin" },
    });
    for (const type of BUILT_IN_TYPES) {
      for (const item of DEFAULTS[type]) {
        await db.taxonomy.upsert({
          where: { code: item.code },
          update: { type, name: item.label, slug: `${type}-${item.code}`, isdelete: false, userupdated_at: "admin" },
          create: { code: item.code, type, name: item.label, slug: `${type}-${item.code}`, usercreate_at: "admin" },
        });
      }
    }
    return this.list();
  }
}

export const adminTaxonomyService = new AdminTaxonomyService();
