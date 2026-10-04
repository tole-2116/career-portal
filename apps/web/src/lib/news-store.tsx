import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { defaultMedia } from "@/data/media";
import type { Localized } from "@/lib/i18n";
import {
  createNews,
  createNewsCategory,
  deleteNews,
  deleteNewsCategory,
  fetchNews,
  fetchNewsCategories,
  updateNews,
} from "@/services/admin-news.api";

export type NewsCategory = { id: string; label: Localized };

export type Article = {
  id: string;
  slug: string;
  categoryId: string;
  cover: string;
  date: string;
  author: string;
  published: boolean;
  featured: boolean;
  title: Localized;
  excerpt: Localized;
  /** Rich text stored as HTML (older plain-text saves are upgraded on read). */
  body: Localized;
};

/** Wraps legacy plain-text bodies into paragraphs so they render as rich text. */
export function toHtml(value: string): string {
  const text = value ?? "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export const defaultCategories: NewsCategory[] = [
  { id: "company", label: { vi: "Hoạt động công ty", en: "Company news" } },
  { id: "culture", label: { vi: "Văn hóa", en: "Culture" } },
  { id: "event", label: { vi: "Sự kiện", en: "Events" } },
  { id: "recruitment", label: { vi: "Tuyển dụng", en: "Recruitment" } },
];

export const defaultArticles: Article[] = [
  {
    id: "a1",
    slug: "ngay-hoi-tuyen-dung-2026",
    categoryId: "recruitment",
    cover: defaultMedia.heroTeam,
    date: "2026-03-12",
    author: "TalentHub",
    published: true,
    featured: true,
    title: {
      vi: "Ngày hội tuyển dụng 2026: gặp gỡ hơn 300 ứng viên",
      en: "Careers Day 2026: meeting more than 300 candidates",
    },
    excerpt: {
      vi: "Một ngày kết nối trực tiếp giữa đội ngũ tuyển dụng và các bạn trẻ đam mê công nghệ.",
      en: "A day of direct connection between our hiring team and young tech talent.",
    },
    body: {
      vi: "Ngày hội tuyển dụng năm nay diễn ra tại ba thành phố với hơn 300 ứng viên tham dự.\n\nCác bạn được trò chuyện trực tiếp với quản lý tuyển dụng, tham quan không gian làm việc và thử sức với những bài toán thực tế mà đội ngũ đang giải quyết mỗi ngày.\n\nChúng tôi sẽ tiếp tục mở rộng chương trình trong các quý tới.",
      en: "This year's careers day took place in three cities with more than 300 candidates.\n\nAttendees met hiring managers, toured our workspaces and tried real problems our teams solve every day.\n\nThe programme will expand over the coming quarters.",
    },
  },
  {
    id: "a2",
    slug: "van-hoa-hoc-tap-lien-tuc",
    categoryId: "culture",
    cover: defaultMedia.culture,
    date: "2026-02-02",
    author: "TalentHub",
    published: true,
    featured: false,
    title: {
      vi: "Văn hóa học tập liên tục tại công ty",
      en: "A culture of continuous learning",
    },
    excerpt: {
      vi: "Mỗi thành viên có ngân sách học tập riêng và hai giờ mỗi tuần dành cho phát triển bản thân.",
      en: "Every teammate gets a learning budget and two hours a week for personal growth.",
    },
    body: {
      vi: "Chúng tôi tin rằng con người phát triển thì sản phẩm mới phát triển.\n\nMỗi thành viên có ngân sách học tập hằng năm, hai giờ mỗi tuần cho việc học và một buổi chia sẻ nội bộ mỗi tháng.",
      en: "We believe products grow when people grow.\n\nEach teammate has an annual learning budget, two hours a week for study and a monthly internal knowledge-sharing session.",
    },
  },
  {
    id: "a3",
    slug: "khai-truong-van-phong-da-nang",
    categoryId: "company",
    cover: defaultMedia.hero,
    date: "2026-01-08",
    author: "TalentHub",
    published: true,
    featured: false,
    title: {
      vi: "Khai trương văn phòng Đà Nẵng",
      en: "Opening our Da Nang office",
    },
    excerpt: {
      vi: "Không gian làm việc mới với sức chứa 120 chỗ ngồi bên bờ sông Hàn.",
      en: "A new 120-seat workspace by the Han river.",
    },
    body: {
      vi: "Văn phòng Đà Nẵng chính thức đi vào hoạt động, mở thêm cơ hội cho các bạn ở khu vực miền Trung.\n\nKhông gian được thiết kế mở, nhiều phòng họp nhỏ và khu vực nghỉ ngơi cho đội ngũ.",
      en: "Our Da Nang office is now open, creating new opportunities in central Vietnam.\n\nThe space is open-plan with plenty of small meeting rooms and lounge areas.",
    },
  },
];

export function makeSlug(value: string, existing: string[]): string {
  const base =
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "bai-viet";
  let slug = base;
  let i = 2;
  while (existing.includes(slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

export function emptyArticle(author = "TalentHub"): Article {
  return {
    id: "",
    slug: "",
    categoryId: defaultCategories[0]!.id,
    cover: defaultMedia.hero,
    date: new Date().toISOString().slice(0, 10),
    author,
    published: false,
    featured: false,
    title: { vi: "", en: "" },
    excerpt: { vi: "", en: "" },
    body: { vi: "", en: "" },
  };
}

type NewsValue = {
  articles: Article[];
  categories: NewsCategory[];
  /** Trạng thái đang tải dữ liệu từ API (dùng cho spinner). */
  loading: boolean;
  /** Lỗi API cuối cùng nếu có (UI toast khi cần). */
  error: string | null;
  /** Tạo mới hoặc cập nhật bài viết — ném lỗi nếu API fail. */
  saveArticle: (article: Article) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  saveCategory: (category: NewsCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  /** Đọc lại toàn bộ dữ liệu từ API. */
  refresh: () => Promise<void>;
};

const NewsContext = createContext<NewsValue | null>(null);

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [newsResult, categoryResult] = await Promise.all([
        fetchNews({ limit: 100 }),
        fetchNewsCategories(),
      ]);
      setArticles(newsResult.articles);
      setCategories(categoryResult.length ? categoryResult : defaultCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được tin tức");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bỏ qua SSR — fetch chỉ chạy phía client.
    if (typeof window !== "undefined") void refresh();
  }, [refresh]);

  const saveArticle = useCallback(
    async (article: Article) => {
      if (article.id) {
        const updated = await updateNews(article.id, article);
        setArticles((current) => current.map((item) => (item.id === article.id ? updated : item)));
      } else {
        const created = await createNews(article);
        setArticles((current) => [created, ...current]);
      }
    },
    [],
  );

  const deleteArticle = useCallback(async (id: string) => {
    await deleteNews(id);
    setArticles((current) => current.filter((item) => item.id !== id));
  }, []);

  const saveCategory = useCallback(async (category: NewsCategory) => {
    const created = await createNewsCategory(category);
    setCategories((current) => {
      const exists = current.some((item) => item.id === created.id);
      return exists
        ? current.map((item) => (item.id === created.id ? created : item))
        : [...current, created];
    });
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await deleteNewsCategory(id);
    setCategories((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<NewsValue>(
    () => ({
      articles,
      categories,
      loading,
      error,
      saveArticle,
      deleteArticle,
      saveCategory,
      deleteCategory,
      refresh,
    }),
    [articles, categories, loading, error, saveArticle, deleteArticle, saveCategory, deleteCategory, refresh],
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews(): NewsValue {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside NewsProvider");
  return ctx;
}
