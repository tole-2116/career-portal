import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { LanguageTabs, LocalizedField } from "@/components/admin/LocalizedInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { heroLibrary, cultureLibrary } from "@/data/media";
import { useI18n } from "@/lib/i18n";
import { useLanguageConfig } from "@/lib/language-config";
import {
  emptyArticle,
  makeSlug,
  toHtml,
  useNews,
  type Article,
  type NewsCategory,
} from "@/lib/news-store";
import {
  createNews,
  createNewsCategory,
  deleteNews,
  deleteNewsCategory,
  fetchNews,
  fetchNewsCategories,
  updateNews,
  uploadNewsCover,
} from "@/services/admin-news.api";
import { useSiteConfig } from "@/lib/site-config";

const RichTextEditor = lazy(() =>
  import("@/components/admin/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
);

export const Route = createFileRoute("/admin/news")({
  head: () => ({
    meta: [
      { title: "Quản lý tin tức — TalentHub HR" },
      {
        name: "description",
        content:
          "Thêm, sửa, xuất bản bài viết tin tức và quản lý chuyên mục cho website tuyển dụng.",
      },
      { property: "og:title", content: "Quản lý tin tức — TalentHub HR" },
      { property: "og:description", content: "Quản lý bài viết và chuyên mục tin tức." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNewsPage,
});

const coverLibrary = [...heroLibrary, ...cultureLibrary].filter(
  (item, index, list) => list.findIndex((other) => other.id === item.id) === index,
);

const PAGE_SIZE = 10;
const ALL = "__all__";

function AdminNewsPage() {
  const { t, tr, lang } = useI18n();
  const { config } = useSiteConfig();
  // Store chỉ dùng để đồng bộ dữ liệu cho các trang public (/news, /news/$slug).
  const { refresh: refreshStore } = useNews();

  const companyName = tr(config.copy.brand) || "TalentHub";

  // Danh sách bài viết lấy trực tiếp qua API (phân trang phía server).
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [publishedFilter, setPublishedFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [draft, setDraft] = useState<Article | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);
  const [categoryName, setCategoryName] = useState({ vi: "", en: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { enabled: enabledLanguages } = useLanguageConfig();
  const [bodyLang, setBodyLang] = useState(lang);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tải danh sách chuyên mục một lần cho dropdown lọc + select trong form.
  useEffect(() => {
    let cancelled = false;
    fetchNewsCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : tr({ vi: "Không tải được chuyên mục.", en: "Failed to load categories." }),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tr]);

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchNews({
        page,
        limit: PAGE_SIZE,
        search: keyword.trim() || undefined,
        categoryId: categoryFilter === ALL ? undefined : categoryFilter,
        published: publishedFilter === ALL ? undefined : publishedFilter === "published",
      });
      setArticles(result.articles);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không tải được bài viết.", en: "Failed to load articles." }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, keyword, categoryFilter, publishedFilter, tr]);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  // Đổi bộ lọc thì quay về trang đầu.
  useEffect(() => {
    setPage(1);
  }, [keyword, categoryFilter, publishedFilter]);

  const openNew = () => {
    setDraft({ ...emptyArticle(companyName), id: `n-${Date.now()}` });
    setSlugTouched(false);
  };

  const openEdit = (article: Article) => {
    setDraft({ ...article, body: { ...article.body } });
    setSlugTouched(true);
  };

  const autoSlug = (title: string, id: string) =>
    makeSlug(
      title,
      articles.filter((item) => item.id !== id).map((item) => item.slug),
    );

  const persist = async (published: boolean) => {
    if (!draft || isSaving) return;
    const title = draft.title.vi || draft.title.en;
    if (!title.trim()) {
      toast.error(tr({ vi: "Vui lòng nhập tiêu đề.", en: "Please enter a title." }));
      return;
    }
    const slug = draft.slug.trim() || autoSlug(title, draft.id);
    setIsSaving(true);
    try {
      const payload: Article = {
        ...draft,
        slug,
        published,
        author: draft.author.trim() || companyName,
        body: {
          ...draft.body,
          vi: toHtml(draft.body.vi),
          en: toHtml(draft.body.en),
        },
      };
      // id tạm (n-...) nghĩa là tạo mới — API sinh id/uuid.
      if (draft.id.startsWith("n-")) {
        await createNews({ ...payload, id: "" });
      } else {
        await updateNews(draft.id, payload);
      }
      setDraft(null);
      await loadArticles();
      void refreshStore();
      toast.success(
        published
          ? tr({ vi: "Đã xuất bản bài viết.", en: "Article published." })
          : tr({ vi: "Đã lưu bản nháp.", en: "Draft saved." }),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không lưu được bài viết.", en: "Failed to save article." }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const onCoverFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(tr({ vi: "Chỉ chấp nhận tệp hình ảnh.", en: "Images only." }));
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error(tr({ vi: "Ảnh tối đa 1MB.", en: "Image must be under 1MB." }));
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadNewsCover(file);
      setDraft((current) => (current ? { ...current, cover: url } : current));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không tải ảnh lên được.", en: "Failed to upload image." }),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const addCategory = async () => {
    if (!categoryName.vi.trim() && !categoryName.en.trim()) return;
    try {
      const created = await createNewsCategory({ id: `c-${Date.now()}`, label: categoryName });
      setCategories((current) => {
        const exists = current.some((item) => item.id === created.id);
        return exists
          ? current.map((item) => (item.id === created.id ? created : item))
          : [...current, created];
      });
      setCategoryName({ vi: "", en: "" });
      void refreshStore();
      toast.success(tr({ vi: "Đã thêm chuyên mục.", en: "Category added." }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không thêm được chuyên mục.", en: "Failed to add category." }),
      );
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await deleteNewsCategory(id);
      setCategories((current) => current.filter((item) => item.id !== id));
      void refreshStore();
      toast.success(tr({ vi: "Đã xóa chuyên mục.", en: "Category deleted." }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không xóa được chuyên mục.", en: "Failed to delete category." }),
      );
    }
  };

  const removeArticle = async () => {
    if (!pendingDelete) return;
    try {
      await deleteNews(pendingDelete.id);
      setPendingDelete(null);
      await loadArticles();
      void refreshStore();
      toast.success(tr({ vi: "Đã xóa bài viết.", en: "Article deleted." }));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr({ vi: "Không xóa được bài viết.", en: "Failed to delete article." }),
      );
    }
  };

  const emptyRowsCount =
    articles.length > 0 && articles.length < PAGE_SIZE ? PAGE_SIZE - articles.length : 0;

  const publishedLabel = (published: boolean) =>
    published
      ? tr({ vi: "Đã xuất bản", en: "Published" })
      : tr({ vi: "Nháp", en: "Draft" });

  return (
    <AdminLayout
      title={tr({ vi: "Tin tức", en: "News" })}
      description={tr({
        vi: "Quản lý bài viết và chuyên mục tin tức.",
        en: "Manage articles and news categories.",
      })}
      action={
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4" /> {tr({ vi: "Thêm bài viết", en: "New article" })}
        </Button>
      }
    >
      <Tabs
        defaultValue="articles"
        className="flex min-h-0 flex-1 flex-col space-y-3.5 overflow-hidden"
      >
        <div className="flex items-center justify-start">
          <TabsList className="shrink-0">
            <TabsTrigger value="articles">
              {tr({ vi: "Bài viết", en: "Articles" })} ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="categories">
              {tr({ vi: "Chuyên mục", en: "Categories" })} ({categories.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="articles"
          className="flex min-h-0 flex-1 flex-col space-y-3.5 overflow-hidden"
        >
          {/* Bộ lọc: từ khóa + chuyên mục + trạng thái */}
          <div className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={tr({ vi: "Tìm theo tiêu đề…", en: "Search by title…" })}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue>
                  {categoryFilter === ALL
                    ? `${t("jobs.filter.all")} — ${tr({ vi: "Chuyên mục", en: "Category" })}`
                    : tr(
                        categories.find((item) => item.id === categoryFilter)?.label ?? {
                          vi: "",
                          en: "",
                        },
                      )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t("jobs.filter.all")} — {tr({ vi: "Chuyên mục", en: "Category" })}
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {tr(category.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={publishedFilter} onValueChange={setPublishedFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue>
                  {publishedFilter === ALL
                    ? `${t("jobs.filter.all")} — ${tr({ vi: "Trạng thái", en: "Status" })}`
                    : publishedLabel(publishedFilter === "published")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t("jobs.filter.all")} — {tr({ vi: "Trạng thái", en: "Status" })}
                </SelectItem>
                <SelectItem value="published">{publishedLabel(true)}</SelectItem>
                <SelectItem value="draft">{publishedLabel(false)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bảng desktop: header dính + body cuộn + footer phân trang */}
          <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs md:flex">
            <div className="shrink-0 overflow-hidden rounded-t-xl border-b-2 border-border/80 bg-muted/60 backdrop-blur-sm">
              <Table className="table-fixed w-full">
                <TableHeader className="bg-transparent">
                  <TableRow className="h-10 border-none hover:bg-transparent">
                    <TableHead className="w-[110px] pl-4 text-xs font-semibold text-foreground/80 select-none">
                      {tr({ vi: "Ảnh", en: "Thumb" })}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground/80 select-none">
                      {tr({ vi: "Tiêu đề", en: "Title" })}
                    </TableHead>
                    <TableHead className="w-[160px] text-xs font-semibold text-foreground/80 select-none">
                      {tr({ vi: "Chuyên mục", en: "Category" })}
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-semibold text-foreground/80 select-none">
                      {tr({ vi: "Tác giả", en: "Author" })}
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold text-foreground/80 select-none">
                      {tr({ vi: "Ngày tạo", en: "Created" })}
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold text-foreground/80 select-none">
                      {tr({ vi: "Trạng thái", en: "Status" })}
                    </TableHead>
                    <TableHead className="w-[100px] pr-4 text-right text-xs font-semibold text-foreground/80 select-none">
                      {tr({ vi: "Hành động", en: "Actions" })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden [&>div]:h-full [&>div]:overflow-hidden">
              <Table className="table-fixed h-full w-full">
                <TableBody className="[&_tr]:h-[10%]">
                  {isLoading && (
                    <TableRow className="h-full">
                      <TableCell colSpan={7} className="p-2 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && articles.length === 0 && (
                    <TableRow className="h-full">
                      <TableCell
                        colSpan={7}
                        className="p-2 text-center text-sm text-muted-foreground"
                      >
                        {tr({ vi: "Chưa có bài viết nào.", en: "No articles yet." })}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading &&
                    articles.map((article) => {
                      const category = categories.find(
                        (item) => item.id === article.categoryId,
                      );
                      return (
                        <TableRow key={article.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="w-[110px] pl-4">
                            <img
                              src={article.cover}
                              alt=""
                              className="h-12 w-20 rounded-md object-cover"
                            />
                          </TableCell>
                          <TableCell className="min-w-0">
                            <span className="block truncate font-medium">
                              {tr(article.title)}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              /{article.slug}
                            </span>
                          </TableCell>
                          <TableCell className="w-[160px] truncate text-sm text-muted-foreground">
                            {category ? tr(category.label) : "—"}
                          </TableCell>
                          <TableCell className="w-[130px] truncate text-sm text-muted-foreground">
                            {article.author}
                          </TableCell>
                          <TableCell className="w-[120px] text-sm text-muted-foreground">
                            {article.date}
                          </TableCell>
                          <TableCell className="w-[120px]">
                            <Badge variant={article.published ? "default" : "secondary"}>
                              {publishedLabel(article.published)}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[100px] pr-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label={tr({ vi: "Sửa", en: "Edit" })}
                              title={tr({ vi: "Sửa", en: "Edit" })}
                              onClick={() => openEdit(article)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                              aria-label={tr({ vi: "Xóa", en: "Delete" })}
                              title={tr({ vi: "Xóa", en: "Delete" })}
                              onClick={() => setPendingDelete(article)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {!isLoading &&
                    emptyRowsCount > 0 &&
                    Array.from({ length: emptyRowsCount }).map((_, index) => (
                      <TableRow
                        key={`empty-row-${index}`}
                        aria-hidden
                        className="border-b border-border/50 hover:bg-transparent pointer-events-none select-none"
                      >
                        <TableCell className="py-3 px-4 w-[110px] text-transparent">
                          &nbsp;
                        </TableCell>
                        <TableCell className="py-3 px-4 text-transparent">&nbsp;</TableCell>
                        <TableCell className="py-3 px-4 w-[160px] text-transparent">
                          &nbsp;
                        </TableCell>
                        <TableCell className="py-3 px-4 w-[130px] text-transparent">
                          &nbsp;
                        </TableCell>
                        <TableCell className="py-3 px-4 w-[120px] text-transparent">
                          &nbsp;
                        </TableCell>
                        <TableCell className="py-3 px-4 w-[120px] text-transparent">
                          &nbsp;
                        </TableCell>
                        <TableCell className="py-3 px-4 w-[100px] text-transparent">
                          &nbsp;
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <div className="shrink-0 border-t border-border/70 bg-muted/30 px-4 py-3 flex items-center justify-between gap-3 select-none">
              <div className="text-xs text-muted-foreground">
                {totalCount > 0 ? (
                  <>
                    {t("admin.jobs.footer.showing")}{" "}
                    <strong className="font-semibold text-foreground">
                      {(page - 1) * PAGE_SIZE + 1}
                    </strong>{" "}
                    -{" "}
                    <strong className="font-semibold text-foreground">
                      {Math.min(page * PAGE_SIZE, totalCount)}
                    </strong>{" "}
                    {t("admin.jobs.footer.of")}{" "}
                    <strong className="font-semibold text-foreground">{totalCount}</strong>{" "}
                    {t("admin.jobs.footer.records")}
                  </>
                ) : (
                  <span>{t("admin.jobs.footer.noRecords")}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {t("admin.jobs.footer.page")}{" "}
                  <strong className="font-semibold text-foreground">{page}</strong> /{" "}
                  {totalPages || 1}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border/70"
                    onClick={() => setPage(1)}
                    disabled={page <= 1 || isLoading}
                    title={t("admin.jobs.footer.firstPage")}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border/70"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page <= 1 || isLoading}
                    title={t("admin.jobs.footer.prevPage")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border/70"
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page >= totalPages || isLoading}
                    title={t("admin.jobs.footer.nextPage")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border/70"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages || isLoading}
                    title={t("admin.jobs.footer.lastPage")}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Cards trên mobile */}
          <div className="min-h-0 flex-1 space-y-3 overflow-auto md:hidden">
            {isLoading && (
              <p className="rounded-xl border border-dashed border-border p-10 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              </p>
            )}
            {!isLoading && articles.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {tr({ vi: "Chưa có bài viết nào.", en: "No articles yet." })}
              </p>
            )}
            {!isLoading &&
              articles.map((article) => (
                <div
                  key={article.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <img src={article.cover} alt="" className="h-14 w-20 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tr(article.title)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={article.published ? "default" : "secondary"}>
                        {publishedLabel(article.published)}
                      </Badge>
                      <span>{article.author}</span>
                      <span>{article.date}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(article)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPendingDelete(article)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-5 min-h-0 flex-1 space-y-4 overflow-auto">
          <div className="rounded-xl border border-border bg-card p-5">
            <LocalizedField
              label={tr({ vi: "Tên chuyên mục", en: "Category name" })}
              value={categoryName}
              onChange={setCategoryName}
            />
            <Button className="mt-4" size="sm" onClick={() => void addCategory()}>
              <Plus className="h-4 w-4" /> {tr({ vi: "Thêm chuyên mục", en: "Add category" })}
            </Button>
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="min-w-0 truncate text-sm font-medium">{tr(category.label)}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {articles.filter((item) => item.categoryId === category.id).length}{" "}
                    {tr({ vi: "bài", en: "articles" })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void removeCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent
          className="max-h-[90vh] overflow-hidden rounded-xl border border-border p-0 shadow-lg sm:max-w-3xl"
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          {draft && (
            <form
              className="flex max-h-[90vh] flex-col overflow-hidden"
              onSubmit={(event) => {
                event.preventDefault();
                void persist(true);
              }}
            >
              <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4">
                <DialogTitle>
                  {draft.id.startsWith("n-")
                    ? tr({ vi: "Bài viết mới", en: "New article" })
                    : tr({ vi: "Chỉnh sửa bài viết", en: "Edit article" })}
                </DialogTitle>
                <DialogDescription className="truncate">
                  {draft.title.vi || draft.title.en || tr({ vi: "Chưa có tiêu đề", en: "Untitled" })}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
                <LocalizedField
                  label={tr({ vi: "Tiêu đề", en: "Title" })}
                  value={draft.title}
                  onChange={(title) =>
                    setDraft((current) => {
                      if (!current) return current;
                      const next = { ...current, title };
                      if (!slugTouched) {
                        const raw = title.vi || title.en;
                        next.slug = raw.trim() ? autoSlug(raw, current.id) : "";
                      }
                      return next;
                    })
                  }
                />

                <div className="space-y-2">
                  <Label htmlFor="article-slug">
                    {tr({ vi: "Đường dẫn (slug)", en: "Slug" })}
                  </Label>
                  <Input
                    id="article-slug"
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setDraft({ ...draft, slug: e.target.value });
                    }}
                    placeholder="tin-tuyen-dung-moi"
                  />
                  <p className="text-xs text-muted-foreground">/news/{draft.slug || "..."}</p>
                </div>

                <LocalizedField
                  label={tr({ vi: "Tóm tắt", en: "Excerpt" })}
                  multiline
                  value={draft.excerpt}
                  onChange={(excerpt) => setDraft({ ...draft, excerpt })}
                />

                <div className="space-y-2">
                  <Label>{tr({ vi: "Nội dung chi tiết", en: "Content" })}</Label>
                  <LanguageTabs
                    active={bodyLang}
                    onChange={setBodyLang}
                    languages={enabledLanguages}
                  />
                  <Suspense
                    fallback={
                      <div className="h-48 animate-pulse rounded-md border border-border bg-muted" />
                    }
                  >
                    <RichTextEditor
                      key={bodyLang}
                      value={draft.body[bodyLang] ?? ""}
                      onChange={(html) =>
                        setDraft((current) =>
                          current
                            ? { ...current, body: { ...current.body, [bodyLang]: html } }
                            : current,
                        )
                      }
                      placeholder={tr({
                        vi: "Nhập nội dung bài viết...",
                        en: "Write the article...",
                      })}
                    />
                  </Suspense>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>{tr({ vi: "Chuyên mục", en: "Category" })}</Label>
                    <Select
                      value={draft.categoryId}
                      onValueChange={(categoryId) => setDraft({ ...draft, categoryId })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {tr(category.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-date">{tr({ vi: "Ngày đăng", en: "Date" })}</Label>
                    <Input
                      id="article-date"
                      type="date"
                      value={draft.date}
                      onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-author">{tr({ vi: "Tác giả", en: "Author" })}</Label>
                    <Input
                      id="article-author"
                      value={draft.author}
                      placeholder={companyName}
                      onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{tr({ vi: "Ảnh đại diện", en: "Cover image" })}</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    {coverLibrary.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, cover: item.url })}
                        className={`overflow-hidden rounded-lg border-2 transition-colors ${
                          draft.cover === item.url ? "border-accent" : "border-transparent"
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={tr(item.label)}
                          className="h-16 w-24 object-cover"
                        />
                      </button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploading || isSaving}
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading
                        ? tr({ vi: "Đang tải…", en: "Uploading…" })
                        : tr({ vi: "Tải ảnh lên", en: "Upload" })}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void onCoverFile(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {draft.cover && !draft.cover.startsWith("data:") && (
                    <img
                      src={draft.cover}
                      alt=""
                      className="h-24 w-40 rounded-lg border border-border object-cover"
                    />
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={draft.featured}
                    onCheckedChange={(featured) => setDraft({ ...draft, featured })}
                  />
                  {tr({ vi: "Nổi bật", en: "Featured" })}
                </label>
              </div>

              <DialogFooter className="shrink-0 border-t border-border/70 bg-muted/20 px-6 py-3.5 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-md px-3.5 text-xs"
                  disabled={isSaving || isUploading}
                  onClick={() => setDraft(null)}
                >
                  <X className="h-3.5 w-3.5" />
                  {tr({ vi: "Hủy", en: "Cancel" })}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-1.5 rounded-md px-3.5 text-xs"
                  disabled={isSaving || isUploading}
                  onClick={() => void persist(false)}
                >
                  {isSaving
                    ? tr({ vi: "Đang lưu…", en: "Saving…" })
                    : tr({ vi: "Lưu nháp", en: "Save as draft" })}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 gap-1.5 rounded-md px-4 text-xs font-medium"
                  disabled={isSaving || isUploading}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {tr({ vi: "Xuất bản", en: "Publish" })}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tr({
                vi: "Bạn có chắc muốn xoá bài viết này không?",
                en: "Delete this article?",
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? tr(pendingDelete.title) : ""} —{" "}
              {tr({ vi: "Hành động này không thể hoàn tác.", en: "This cannot be undone." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr({ vi: "Hủy", en: "Cancel" })}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void removeArticle()}>
              {tr({ vi: "Xóa", en: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
