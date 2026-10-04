import type { Article, NewsCategory } from "@/lib/news-store";
import { getApiToken } from "@/lib/auth-store";
import type { Localized } from "@/lib/i18n";

const ADMIN_BASE = "/api/admin/news";
const PUBLIC_BASE = "/api/news";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ApiCategory {
  id: string;
  code: string;
  type: string;
  label: Localized;
}

interface ApiNews {
  id: string;
  code: string | null;
  slug: string;
  categoryId: string;
  category: ApiCategory | null;
  coverUrl: string;
  date: string;
  author: string;
  published: boolean;
  featured: boolean;
  title: Localized;
  excerpt: Localized;
  body: Localized;
}

interface ApiListResult {
  news: ApiNews[];
  total: number;
  page: number;
  totalPages: number;
}

function localized(value: unknown): Localized {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { vi: "", en: "" };
  const raw = value as { vi?: unknown; en?: unknown };
  return {
    vi: typeof raw.vi === "string" ? raw.vi : "",
    en: typeof raw.en === "string" ? raw.en : "",
  };
}

function mapCategory(raw: ApiCategory): NewsCategory {
  return { id: raw.code, label: localized(raw.label) };
}

function mapArticle(raw: ApiNews): Article {
  return {
    id: raw.id,
    slug: raw.slug,
    categoryId: raw.categoryId,
    cover: raw.coverUrl || "",
    date: raw.date ? raw.date.slice(0, 10) : "",
    author: raw.author || "TalentHub",
    published: raw.published,
    featured: raw.featured,
    title: localized(raw.title),
    excerpt: localized(raw.excerpt),
    body: localized(raw.body),
  };
}

async function request<T>(input: string, init?: RequestInit, authenticated = true): Promise<T> {
  const token = authenticated ? getApiToken() : null;
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Proxy/network errors may return a non-JSON response.
  }
  if (!response.ok) throw new Error(body?.error || `Request failed with status ${response.status}`);
  if (body?.success === false) throw new Error(body.error || "Request failed");
  return body?.data as T;
}

function toPayload(article: Article) {
  return {
    slug: article.slug,
    categoryId: article.categoryId,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    coverUrl: article.cover,
    date: article.date,
    published: article.published,
    featured: article.featured,
  };
}

export async function fetchNews(params: {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  published?: boolean;
} = {}): Promise<{ articles: Article[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.search) query.set("search", params.search);
  if (params.published !== undefined) query.set("published", String(params.published));
  const suffix = query.toString() ? `?${query}` : "";
  const result = await request<ApiListResult>(`${ADMIN_BASE}${suffix}`);
  return {
    articles: (result?.news ?? []).map(mapArticle),
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    totalPages: result?.totalPages ?? 1,
  };
}

export async function fetchPublicNews(): Promise<Article[]> {
  const result = await request<ApiListResult>(`${PUBLIC_BASE}?limit=100`, undefined, false);
  return (result?.news ?? []).map(mapArticle);
}

export async function fetchNewsBySlug(slug: string): Promise<Article | null> {
  try {
    const result = await request<ApiNews>(`${PUBLIC_BASE}/${encodeURIComponent(slug)}`, undefined, false);
    return result ? mapArticle(result) : null;
  } catch (error) {
    if (error instanceof Error && error.message === "News article not found") return null;
    throw error;
  }
}

export async function fetchNewsCategories(): Promise<NewsCategory[]> {
  const result = await request<ApiCategory[]>(`${ADMIN_BASE}/categories`);
  return (result ?? []).map(mapCategory);
}

export async function createNews(article: Article): Promise<Article> {
  const result = await request<ApiNews>(ADMIN_BASE, {
    method: "POST",
    body: JSON.stringify(toPayload(article)),
  });
  return mapArticle(result);
}

export async function updateNews(id: string, article: Article): Promise<Article> {
  const result = await request<ApiNews>(`${ADMIN_BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(toPayload(article)),
  });
  return mapArticle(result);
}

export async function deleteNews(id: string): Promise<void> {
  await request<unknown>(`${ADMIN_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function createNewsCategory(category: NewsCategory): Promise<NewsCategory> {
  const result = await request<ApiCategory>(`${ADMIN_BASE}/categories`, {
    method: "POST",
    body: JSON.stringify({ code: category.id, label: category.label }),
  });
  return mapCategory(result);
}

export async function deleteNewsCategory(id: string): Promise<void> {
  await request<unknown>(`${ADMIN_BASE}/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function uploadNewsCover(file: File): Promise<string> {
  const form = new FormData();
  form.append("cover", file);
  const result = await request<{ url: string }>(`${ADMIN_BASE}/upload`, {
    method: "POST",
    body: form,
  });
  return result.url;
}
