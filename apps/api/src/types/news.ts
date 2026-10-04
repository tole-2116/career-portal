export interface NewsLocalizedText {
  vi: string;
  en: string;
}

export interface NewsModelQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  published?: boolean;
}

export interface NewsCategoryInfo {
  id: string;
  code: string;
  type: string;
  label: NewsLocalizedText;
}

export interface NewsListItem {
  id: string;
  code: string | null;
  slug: string;
  categoryId: string;
  category: NewsCategoryInfo | null;
  coverUrl: string;
  date: string;
  author: string;
  published: boolean;
  featured: boolean;
  title: NewsLocalizedText;
  excerpt: NewsLocalizedText;
  body: NewsLocalizedText;
}

export interface NewsPaginatedResponse {
  news: NewsListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface NewsModel {
  slug?: string;
  categoryId?: string;
  title?: NewsLocalizedText;
  excerpt?: NewsLocalizedText;
  body?: NewsLocalizedText;
  coverUrl?: string | null;
  date?: string;
  published?: boolean;
  featured?: boolean;
}

export interface NewsCategoryPayload {
  code?: string;
  label: NewsLocalizedText;
}
