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

const STORAGE_KEY = "talenthub-news";

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

function readStored(): { articles: Article[]; categories: NewsCategory[] } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<{
      articles: Article[];
      categories: NewsCategory[];
    }>;
    return {
      articles: Array.isArray(parsed.articles)
        ? parsed.articles.map((item) => ({ ...item, author: item.author || "TalentHub" }))
        : defaultArticles,
      categories: Array.isArray(parsed.categories) ? parsed.categories : defaultCategories,
    };
  } catch {
    return null;
  }
}

export function makeSlug(value: string, existing: string[]): string {
  const base =
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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
  saveArticle: (article: Article) => void;
  deleteArticle: (id: string) => void;
  saveCategory: (category: NewsCategory) => void;
  deleteCategory: (id: string) => void;
  resetNews: () => void;
};

const NewsContext = createContext<NewsValue | null>(null);

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>(defaultArticles);
  const [categories, setCategories] = useState<NewsCategory[]>(defaultCategories);

  useEffect(() => {
    const stored = readStored();
    if (!stored) return;
    setArticles(stored.articles);
    setCategories(stored.categories);
  }, []);

  const persist = useCallback((nextArticles: Article[], nextCategories: NewsCategory[]) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ articles: nextArticles, categories: nextCategories }),
      );
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const saveArticle = useCallback(
    (article: Article) => {
      setArticles((current) => {
        const exists = current.some((item) => item.id === article.id);
        const next = exists
          ? current.map((item) => (item.id === article.id ? article : item))
          : [article, ...current];
        setCategories((cats) => {
          persist(next, cats);
          return cats;
        });
        return next;
      });
    },
    [persist],
  );

  const deleteArticle = useCallback(
    (id: string) => {
      setArticles((current) => {
        const next = current.filter((item) => item.id !== id);
        setCategories((cats) => {
          persist(next, cats);
          return cats;
        });
        return next;
      });
    },
    [persist],
  );

  const saveCategory = useCallback(
    (category: NewsCategory) => {
      setCategories((current) => {
        const exists = current.some((item) => item.id === category.id);
        const next = exists
          ? current.map((item) => (item.id === category.id ? category : item))
          : [...current, category];
        setArticles((list) => {
          persist(list, next);
          return list;
        });
        return next;
      });
    },
    [persist],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((current) => {
        const next = current.filter((item) => item.id !== id);
        setArticles((list) => {
          persist(list, next);
          return list;
        });
        return next;
      });
    },
    [persist],
  );

  const resetNews = useCallback(() => {
    setArticles(defaultArticles);
    setCategories(defaultCategories);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<NewsValue>(
    () => ({
      articles,
      categories,
      saveArticle,
      deleteArticle,
      saveCategory,
      deleteCategory,
      resetNews,
    }),
    [articles, categories, saveArticle, deleteArticle, saveCategory, deleteCategory, resetNews],
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews(): NewsValue {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used inside NewsProvider");
  return ctx;
}
