// Helpers chung cho các service admin: chuẩn hoá phân trang, đọc/ghi cột JSON {vi,en},
// slugify tiếng Việt, payload xoá mềm. Mỗi helper giữ đúng biến thể hành vi mà các service
// hiện dùng — qua `opts` — để refactor không làm đổi output.
// Export dạng hàm để helper cấp module dùng được; BaseService bọc lại thành protected method
// cho class gọi qua `this.`.

const FALLBACK_PAGE = 1;
const FALLBACK_LIMIT = 10;
const LIMIT_CAP = 100;

/** Bề mặt delegate Prisma mà bộ CRUD generic dùng (đủ rộng cho mọi model trong app). */
export type CrudDelegate = {
  findMany(args?: unknown): Promise<Record<string, unknown>[]>;
  count(args?: unknown): Promise<number>;
  findFirst(args?: unknown): Promise<Record<string, unknown> | null>;
  create(args?: unknown): Promise<Record<string, unknown>>;
  update(args?: unknown): Promise<Record<string, unknown>>;
};

/** Query phân trang tối thiểu mọi list endpoint nhận. */
export type PaginatedQuery = { page?: number; limit?: number; search?: string };

export function normalizePage(value: number | undefined): number {
  return Number.isInteger(value) && value && value > 0 ? value : FALLBACK_PAGE;
}

export function normalizeLimit(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) return FALLBACK_LIMIT;
  return Math.min(value, LIMIT_CAP);
}

/**
 * Tính `page`/`totalPages` đã kẹp cho kết quả phân trang.
 * Mặc định kẹp (`Math.max(1,...)` cho totalPages, `Math.min(page,totalPages)` cho page);
 * truyền `{ clamp: false }` để giữ hành vi cũ của job/news (không kẹp, totalPages có thể = 0).
 */
export function paginationMeta(
  page: number,
  limit: number,
  total: number,
  opts?: { clamp?: boolean },
): { page: number; totalPages: number } {
  const clamp = opts?.clamp ?? true;
  const totalPages = clamp ? Math.max(1, Math.ceil(total / limit)) : Math.ceil(total / limit);
  return { page: clamp ? Math.min(page, totalPages) : page, totalPages };
}

/** Đọc cột Json {vi,en} kiểu nghiêm ngặt: default rỗng, KHÔNG trim, KHÔNG cross-fill. */
export function readLocalizedStrict(value: unknown): { vi: string; en: string } {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value as { vi?: unknown; en?: unknown };
    return {
      vi: typeof raw.vi === "string" ? raw.vi : "",
      en: typeof raw.en === "string" ? raw.en : "",
    };
  }
  return { vi: "", en: "" };
}

/** Đọc cột Json {vi,en} với cross-fill `vi||en`/`en||vi`. Mặc định trim; `{trim:false}` bỏ trim. */
export function readLocalized(
  value: unknown,
  opts?: { trim?: boolean },
): { vi: string; en: string } {
  const trim = opts?.trim ?? true;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { vi: "", en: "" };
  }
  const raw = value as { vi?: unknown; en?: unknown };
  const read = (input: unknown): string => {
    if (typeof input !== "string") return "";
    return trim ? input.trim() : input;
  };
  const vi = read(raw.vi);
  const en = read(raw.en);
  return { vi: vi || en, en: en || vi };
}

/**
 * Chuyển {vi,en} sang object {en,vi} cho cột Json Prisma. Dùng `vi ?? en` để đổ về `en` khi `vi`
 * thiếu; giữ nguyên chuỗi rỗng "" (`??` không thay thế "") nên khớp cả job lẫn news.
 */
export function toLocalizedObj(text: { en: string; vi?: string }): { en: string; vi: string } {
  return { en: text.en, vi: text.vi ?? text.en };
}

/** Slugify tiếng Việt. Sau khi tạo slug: áp `maxLength` (nếu có), rồi `fallback` nếu rỗng. */
export function slugify(
  value: string,
  opts?: { maxLength?: number; fallback?: string },
): string {
  let result = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (opts?.maxLength !== undefined) result = result.slice(0, opts.maxLength);
  if (!result && opts?.fallback) result = opts.fallback;
  return result;
}

/** Payload xoá mềm. Actor luôn do call-site truyền; không default actor ở đây. */
export function softDeleteData(actor?: string): { isdelete: true; userupdated_at?: string } {
  return { isdelete: true, ...(actor ? { userupdated_at: actor } : {}) };
}

/** Base của mọi service admin — bọc các helper trên thành protected method gọi qua `this.`. */
export class BaseService<TItem = unknown> {
  protected readonly DEFAULT_PAGE = FALLBACK_PAGE;
  protected readonly DEFAULT_LIMIT = FALLBACK_LIMIT;
  protected readonly MAX_LIMIT = LIMIT_CAP;

  // Config cho bộ CRUD generic. Subclass gán trong constructor (giữ `new X()` không tham số).
  protected model!: CrudDelegate;
  protected orderByCol = "created_at";
  protected searchCols: string[] = [];
  protected rowSelect?: object;
  protected itemsKey = "items";
  protected mapRow?: (row: never) => TItem | Promise<TItem>;
  protected notFoundMsg?: string;
  protected deleteActor?: string;

  protected normalizePage(value?: number): number {
    return normalizePage(value);
  }

  protected normalizeLimit(value?: number): number {
    return normalizeLimit(value);
  }

  protected paginationMeta(
    page: number,
    limit: number,
    total: number,
    opts?: { clamp?: boolean },
  ): { page: number; totalPages: number } {
    return paginationMeta(page, limit, total, opts);
  }

  protected readLocalizedStrict(value: unknown): { vi: string; en: string } {
    return readLocalizedStrict(value);
  }

  protected readLocalized(value: unknown, opts?: { trim?: boolean }): { vi: string; en: string } {
    return readLocalized(value, opts);
  }

  protected toLocalizedObj(text: { en: string; vi?: string }): { en: string; vi: string } {
    return toLocalizedObj(text);
  }

  protected slugify(value: string, opts?: { maxLength?: number; fallback?: string }): string {
    return slugify(value, opts);
  }

  protected softDeleteData(actor?: string): { isdelete: true; userupdated_at?: string } {
    return softDeleteData(actor);
  }

  /** Hook cho subclass thêm điều kiện `where` riêng mà không phải viết lại findMany. */
  protected extraWhere(_query: any): Record<string, unknown> {
    return {};
  }

  private mapResult(row: unknown): TItem | Promise<TItem> {
    return this.mapRow ? this.mapRow(row as never) : (row as TItem);
  }

  private selectArg(): { select?: object } {
    return this.rowSelect ? { select: this.rowSelect } : {};
  }

  /** List phân trang: chuẩn hoá page/limit, lọc isdelete + OR-search, count song song, map DTO. */
  async findMany(...args: any[]): Promise<any> {
    const q: PaginatedQuery = args[0] ?? {};
    const page = this.normalizePage(q.page);
    const limit = this.normalizeLimit(q.limit);
    const where: Record<string, unknown> = { isdelete: false, ...this.extraWhere(q) };

    const search = q.search?.trim();
    if (search && this.searchCols.length) {
      where.OR = this.searchCols.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      }));
    }

    const [rows, total] = await Promise.all([
      this.model.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [this.orderByCol]: "desc" },
        ...this.selectArg(),
      }),
      this.model.count({ where }),
    ]);

    const items = await Promise.all(rows.map((row) => Promise.resolve(this.mapResult(row))));

    return { [this.itemsKey]: items, total, ...this.paginationMeta(page, limit, total) };
  }

  async findOne(id: string): Promise<any> {
    const row = await this.model.findFirst({ where: { id, isdelete: false }, ...this.selectArg() });
    if (!row && this.notFoundMsg) throw new Error(this.notFoundMsg);
    return Promise.resolve(this.mapResult(row));
  }

  // Chữ ký rộng (`...args`) để subclass override tự do với hình dạng tham số của riêng nó.
  async create(...args: any[]): Promise<any> {
    const row = await this.model.create({ data: args[0], ...this.selectArg() });
    return Promise.resolve(this.mapResult(row));
  }

  async update(...args: any[]): Promise<any> {
    await this.assertExists(args[0]);
    const row = await this.model.update({ where: { id: args[0] }, data: args[1], ...this.selectArg() });
    return Promise.resolve(this.mapResult(row));
  }

  /** Xoá mềm: đặt isdelete=true, kèm actor nếu có. Giữ hành vi theo service qua deleteActor. */
  async remove(...args: any[]): Promise<void> {
    await this.assertExists(args[0]);
    await this.model.update({ where: { id: args[0] }, data: this.softDeleteData(args[1] ?? this.deleteActor) });
  }

  private async assertExists(id: string): Promise<void> {
    if (!this.notFoundMsg) return;
    const existing = await this.model.findFirst({ where: { id, isdelete: false }, select: { id: true } });
    if (!existing) throw new Error(this.notFoundMsg);
  }
}
