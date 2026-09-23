import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { Suspense, lazy, useRef, useState } from "react";
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
import { emptyArticle, makeSlug, toHtml, useNews, type Article } from "@/lib/news-store";
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

function AdminNewsPage() {
  const { tr, lang } = useI18n();
  const { config } = useSiteConfig();
  const {
    articles,
    categories,
    saveArticle,
    deleteArticle,
    saveCategory,
    deleteCategory,
    resetNews,
  } = useNews();

  const companyName = tr(config.copy.brand) || "TalentHub";
  const [draft, setDraft] = useState<Article | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);
  const [categoryName, setCategoryName] = useState({ vi: "", en: "" });
  const { enabled: enabledLanguages } = useLanguageConfig();
  const [bodyLang, setBodyLang] = useState(lang);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const persist = (published: boolean) => {
    if (!draft) return;
    const title = draft.title.vi || draft.title.en;
    if (!title.trim()) {
      toast.error(tr({ vi: "Vui lòng nhập tiêu đề.", en: "Please enter a title." }));
      return;
    }
    const slug = draft.slug.trim() || autoSlug(title, draft.id);
    saveArticle({
      ...draft,
      slug,
      published,
      author: draft.author.trim() || companyName,
      body: {
        ...draft.body,
        vi: toHtml(draft.body.vi),
        en: toHtml(draft.body.en),
      },
    });
    setDraft(null);
    toast.success(
      published
        ? tr({ vi: "Đã xuất bản bài viết.", en: "Article published." })
        : tr({ vi: "Đã lưu bản nháp.", en: "Draft saved." }),
    );
  };

  const onCoverFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(tr({ vi: "Chỉ chấp nhận tệp hình ảnh.", en: "Images only." }));
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error(tr({ vi: "Ảnh tối đa 1MB.", en: "Image must be under 1MB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (url) setDraft((current) => (current ? { ...current, cover: url } : current));
    };
    reader.readAsDataURL(file);
  };

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
      <div className="space-y-6 p-4 sm:p-6">
        <Tabs defaultValue="articles">
          <TabsList className="flex-wrap">
            <TabsTrigger value="articles">
              {tr({ vi: "Bài viết", en: "Articles" })} ({articles.length})
            </TabsTrigger>
            <TabsTrigger value="categories">
              {tr({ vi: "Chuyên mục", en: "Categories" })} ({categories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-5 space-y-4">
            {articles.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {tr({ vi: "Chưa có bài viết nào.", en: "No articles yet." })}
              </p>
            ) : (
              <>
                {/* Table on desktop */}
                <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">{tr({ vi: "Ảnh", en: "Thumb" })}</TableHead>
                        <TableHead>{tr({ vi: "Tiêu đề", en: "Title" })}</TableHead>
                        <TableHead>{tr({ vi: "Tác giả", en: "Author" })}</TableHead>
                        <TableHead>{tr({ vi: "Ngày tạo", en: "Created" })}</TableHead>
                        <TableHead>{tr({ vi: "Trạng thái", en: "Status" })}</TableHead>
                        <TableHead className="w-24 text-right">
                          {tr({ vi: "Hành động", en: "Actions" })}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articles.map((article) => {
                        const category = categories.find((item) => item.id === article.categoryId);
                        return (
                          <TableRow key={article.id}>
                            <TableCell>
                              <img
                                src={article.cover}
                                alt=""
                                className="h-12 w-20 rounded-md object-cover"
                              />
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate font-medium">{tr(article.title)}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                /{article.slug}
                                {category ? ` · ${tr(category.label)}` : ""}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm">{article.author}</TableCell>
                            <TableCell className="text-sm">{article.date}</TableCell>
                            <TableCell>
                              <Badge variant={article.published ? "default" : "secondary"}>
                                {article.published
                                  ? tr({ vi: "Đã xuất bản", en: "Published" })
                                  : tr({ vi: "Nháp", en: "Draft" })}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={tr({ vi: "Sửa", en: "Edit" })}
                                onClick={() => openEdit(article)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={tr({ vi: "Xóa", en: "Delete" })}
                                onClick={() => setPendingDelete(article)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Cards on mobile */}
                <div className="space-y-3 md:hidden">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <img src={article.cover} alt="" className="h-14 w-20 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{tr(article.title)}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant={article.published ? "default" : "secondary"}>
                            {article.published
                              ? tr({ vi: "Đã xuất bản", en: "Published" })
                              : tr({ vi: "Nháp", en: "Draft" })}
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
              </>
            )}
            <Button variant="outline" size="sm" onClick={resetNews}>
              <RotateCcw className="h-4 w-4" />
              {tr({ vi: "Khôi phục dữ liệu mẫu", en: "Restore sample content" })}
            </Button>
          </TabsContent>

          <TabsContent value="categories" className="mt-5 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <LocalizedField
                label={tr({ vi: "Tên chuyên mục", en: "Category name" })}
                value={categoryName}
                onChange={setCategoryName}
              />
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  if (!categoryName.vi.trim() && !categoryName.en.trim()) return;
                  saveCategory({ id: `c-${Date.now()}`, label: categoryName });
                  setCategoryName({ vi: "", en: "" });
                  toast.success(tr({ vi: "Đã thêm chuyên mục.", en: "Category added." }));
                }}
              >
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
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr({ vi: "Bài viết", en: "Article" })}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-5">
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
                <Label htmlFor="article-slug">{tr({ vi: "Đường dẫn (slug)", en: "Slug" })}</Label>
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
                      current ? { ...current, body: { ...current.body, [bodyLang]: html } } : current,
                    )
                  }
                  placeholder={tr({ vi: "Nhập nội dung bài viết...", en: "Write the article..." })}
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
                      <img src={item.url} alt={tr(item.label)} className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {tr({ vi: "Tải ảnh lên", en: "Upload" })}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onCoverFile(file);
                      e.target.value = "";
                    }}
                  />
                </div>
                {draft.cover.startsWith("data:") && (
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {tr({ vi: "Hủy", en: "Cancel" })}
            </Button>
            <Button variant="secondary" onClick={() => persist(false)}>
              {tr({ vi: "Lưu nháp", en: "Save as draft" })}
            </Button>
            <Button onClick={() => persist(true)}>{tr({ vi: "Xuất bản", en: "Publish" })}</Button>
          </DialogFooter>
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
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteArticle(pendingDelete.id);
                setPendingDelete(null);
                toast.success(tr({ vi: "Đã xóa bài viết.", en: "Article deleted." }));
              }}
            >
              {tr({ vi: "Xóa", en: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
