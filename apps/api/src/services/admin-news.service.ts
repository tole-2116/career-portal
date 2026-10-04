import { db, Prisma } from "@career-portal/database";
import type {
  NewsModel,
  NewsModelQuery,
  NewsListItem,
  NewsCategoryInfo,
  NewsLocalizedText,
  NewsCategoryPayload,
} from "../types/news";

/** Đọc cột Json an toàn ra {vi, en}. */
function readLocalized(value: unknown): NewsLocalizedText {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value as { vi?: unknown; en?: unknown };
    return {
      vi: typeof raw.vi === "string" ? raw.vi : "",
      en: typeof raw.en === "string" ? raw.en : "",
    };
  }
  return { vi: "", en: "" };
}

/** Chuyển NewsLocalizedText sang object {en, vi} cho Prisma Json field. */
function toLocalizedObj(text: NewsLocalizedText): { en: string; vi: string } {
  return { en: text.en, vi: text.vi };
}

/** Format ISO date thành yyyy-mm-dd. */
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Slugify tiếng Việt: remove accents, đ->d, keep a-z0-9, - separator. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/** Tạo slug duy nhất, append -2, -3... nếu bị trùng. */
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db.news.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export class AdminNewsService {
  async findMany(query: NewsModelQuery = {}) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isdelete: false };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.published !== undefined) {
      where.published = query.published;
    }

    if (query.search) {
      where.OR = [
        { slug: { contains: query.search, mode: "insensitive" } },
        { title: { path: ["en"], string_contains: query.search } },
        { title: { path: ["vi"], string_contains: query.search } },
      ];
    }

    const [news, total] = await Promise.all([
      db.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: { author: { select: { name: true } } },
      }),
      db.news.count({ where }),
    ]);

    // Load category labels từ Taxonomy
    const categoryIds = Array.from(new Set(news.map((n) => n.categoryId).filter(Boolean)));
    const categories = await db.taxonomy.findMany({
      where: { code: { in: categoryIds }, type: "newsCategory" },
    });
    const categoryMap = new Map(
      categories.map((c) => [c.code, { id: c.id, code: c.code, type: c.type, label: readLocalized(c.name) }]),
    );

    const formatted: NewsListItem[] = news.map((item) => ({
      id: item.id,
      code: item.code,
      slug: item.slug,
      categoryId: item.categoryId,
      category: categoryMap.get(item.categoryId) ?? null,
      coverUrl: item.coverUrl || "",
      date: toDateString(item.date),
      author: item.author.name,
      published: item.published,
      featured: item.featured,
      title: readLocalized(item.title),
      excerpt: readLocalized(item.excerpt),
      body: readLocalized(item.body),
    }));

    return {
      news: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<NewsListItem | null> {
    const item = await db.news.findFirst({
      where: { id },
      include: { author: { select: { name: true } } },
    });

    if (!item) return null;

    const category = await db.taxonomy.findFirst({
      where: { code: item.categoryId, type: "newsCategory" },
    });

    return {
      id: item.id,
      code: item.code,
      slug: item.slug,
      categoryId: item.categoryId,
      category: category
        ? { id: category.id, code: category.code, type: category.type, label: readLocalized(category.name) }
        : null,
      coverUrl: item.coverUrl || "",
      date: toDateString(item.date),
      author: item.author.name,
      published: item.published,
      featured: item.featured,
      title: readLocalized(item.title),
      excerpt: readLocalized(item.excerpt),
      body: readLocalized(item.body),
    };
  }

  async findBySlug(slug: string): Promise<NewsListItem | null> {
    const item = await db.news.findFirst({
      where: { slug, published: true },
      include: { author: { select: { name: true } } },
    });

    if (!item) return null;

    const category = await db.taxonomy.findFirst({
      where: { code: item.categoryId, type: "newsCategory" },
    });

    return {
      id: item.id,
      code: item.code,
      slug: item.slug,
      categoryId: item.categoryId,
      category: category
        ? { id: category.id, code: category.code, type: category.type, label: readLocalized(category.name) }
        : null,
      coverUrl: item.coverUrl || "",
      date: toDateString(item.date),
      author: item.author.name,
      published: item.published,
      featured: item.featured,
      title: readLocalized(item.title),
      excerpt: readLocalized(item.excerpt),
      body: readLocalized(item.body),
    };
  }

  async create(data: NewsModel, authorId: string) {
    const title = data.title ?? { vi: "", en: "" };
    const baseSlug = data.slug || slugify(title.en || title.vi);
    const slug = await ensureUniqueSlug(baseSlug);

    const code = `n-${Date.now()}`;

    const news = await db.news.create({
      data: {
        code,
        slug,
        categoryId: data.categoryId ?? "",
        title: toLocalizedObj(title),
        excerpt: toLocalizedObj(data.excerpt ?? { vi: "", en: "" }),
        body: toLocalizedObj(data.body ?? { vi: "", en: "" }),
        coverUrl: data.coverUrl?.trim() || "",
        date: data.date ? new Date(data.date) : new Date(),
        published: data.published ?? false,
        featured: data.featured ?? false,
        authorId,
      },
      include: { author: { select: { name: true } } },
    });

    const category = await db.taxonomy.findFirst({
      where: { code: news.categoryId, type: "newsCategory" },
    });

    return {
      id: news.id,
      code: news.code,
      slug: news.slug,
      categoryId: news.categoryId,
      category: category
        ? { id: category.id, code: category.code, type: category.type, label: readLocalized(category.name) }
        : null,
      coverUrl: news.coverUrl || "",
      date: toDateString(news.date),
      author: news.author.name,
      published: news.published,
      featured: news.featured,
      title: readLocalized(news.title),
      excerpt: readLocalized(news.excerpt),
      body: readLocalized(news.body),
    };
  }

  async update(id: string, data: NewsModel) {
    const updateData: Record<string, unknown> = {
      ...(data.title && { title: toLocalizedObj(data.title) }),
      ...(data.excerpt && { excerpt: toLocalizedObj(data.excerpt) }),
      ...(data.body && { body: toLocalizedObj(data.body) }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl?.trim() || "" }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.published !== undefined && { published: data.published }),
      ...(data.featured !== undefined && { featured: data.featured }),
    };

    if (data.slug) {
      const baseSlug = slugify(data.slug);
      updateData.slug = await ensureUniqueSlug(baseSlug, id);
    }

    const news = await db.news.update({
      where: { id },
      data: updateData,
      include: { author: { select: { name: true } } },
    });

    const category = await db.taxonomy.findFirst({
      where: { code: news.categoryId, type: "newsCategory" },
    });

    return {
      id: news.id,
      code: news.code,
      slug: news.slug,
      categoryId: news.categoryId,
      category: category
        ? { id: category.id, code: category.code, type: category.type, label: readLocalized(category.name) }
        : null,
      coverUrl: news.coverUrl || "",
      date: toDateString(news.date),
      author: news.author.name,
      published: news.published,
      featured: news.featured,
      title: readLocalized(news.title),
      excerpt: readLocalized(news.excerpt),
      body: readLocalized(news.body),
    };
  }

  async delete(id: string) {
    const existing = await db.news.findFirst({ where: { id } });
    if (!existing) throw new Error("News article not found");

    return db.news.update({
      where: { id },
      data: { isdelete: true, userupdated_at: "system_delete" },
    });
  }

  async findCategories(): Promise<NewsCategoryInfo[]> {
    const taxonomies = await db.taxonomy.findMany({
      where: { type: "newsCategory" },
    });

    return taxonomies.map((t) => ({
      id: t.id,
      code: t.code,
      type: t.type,
      label: readLocalized(t.name),
    }));
  }

  async createCategory(payload: NewsCategoryPayload) {
    const code = payload.code || slugify(payload.label.en || payload.label.vi);
    const slug = slugify(payload.label.en || payload.label.vi);

    const taxonomy = await db.taxonomy.upsert({
      where: { code },
      update: {
        name: toLocalizedObj(payload.label),
        slug,
      },
      create: {
        code,
        type: "newsCategory",
        name: toLocalizedObj(payload.label),
        slug,
      },
    });

    return {
      id: taxonomy.id,
      code: taxonomy.code,
      type: taxonomy.type,
      label: readLocalized(taxonomy.name),
    };
  }

  async deleteCategory(idOrCode: string) {
    const taxonomy = await db.taxonomy.findFirst({
      where: {
        type: "newsCategory",
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
    });
    if (!taxonomy) throw new Error("News category not found");

    return db.taxonomy.update({
      where: { id: taxonomy.id },
      data: { isdelete: true, userupdated_at: "system_delete" },
    });
  }
}

export const adminNewsService = new AdminNewsService();
