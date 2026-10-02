import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  X,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  LocalizedField as BiField,
} from "@/components/admin/LocalizedInput";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Job, JobStatus } from "@/data/jobs";
import { useI18n, type Localized } from "@/lib/i18n";
import { emptyJob } from "@/lib/jobs-store";
import { useTaxonomies, type TaxonomyKey } from "@/lib/taxonomy-store";
import { fetchJobs, createJob, updateJob, deleteJob, toApiPayload, fetchJobTaxonomies } from "@/lib/api/jobs";

export const Route = createFileRoute("/admin/jobs")({
  head: () => ({
    meta: [
      { title: "Tin tuyển dụng — TalentHub HR" },
      {
        name: "description",
        content: "Quản lý tin tuyển dụng: tạo, chỉnh sửa và theo dõi trạng thái từng vị trí.",
      },
      { property: "og:title", content: "Tin tuyển dụng — TalentHub HR" },
      {
        property: "og:description",
        content: "Tạo, chỉnh sửa và theo dõi trạng thái từng tin tuyển dụng.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminJobsPage,
});

const statusLabels: Record<JobStatus, Localized> = {
  draft: { vi: "Nháp", en: "Draft" },
  open: { vi: "Đang tuyển", en: "Open" },
  paused: { vi: "Tạm dừng", en: "Paused" },
  expired: { vi: "Hết hạn", en: "Expired" },
  closed: { vi: "Đã đóng", en: "Closed" },
};

const statusVariant: Record<JobStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  open: "default",
  paused: "secondary",
  expired: "destructive",
  closed: "outline",
};

const ALL = "__all__";

/** Số dòng mỗi trang — khớp `limit` mặc định của GET /api/admin/jobs. */
const PAGE_SIZE = 10;

const emptyLocalized: Localized = { vi: "", en: "" };

/** Option taxonomy cho form: id + label lấy từ database. */
type TaxonomyOption = { id: string; label: Localized };

/** Pick a taxonomy value; options come from the DB so IDs match what the API stores. */
function TaxonomyField({
  label,
  options,
  valueId,
  onChange,
}: {
  label: string;
  options: TaxonomyOption[];
  valueId?: string | undefined;
  onChange: (id: string, next: Localized) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={valueId ?? ""}
        onValueChange={(next) => {
          const picked = options.find((entry) => entry.id === next);
          onChange(next, picked ? { ...picked.label } : emptyLocalized);
        }}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              {entry.label.vi || entry.label.en}
              {entry.label.vi && entry.label.en ? ` · ${entry.label.en}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Pick several work locations from the DB catalogue (values are Taxonomy IDs). */
function LocationsField({
  options,
  ids,
  onChange,
}: {
  options: TaxonomyOption[];
  ids: string[];
  onChange: (ids: string[], next: Localized[]) => void;
}) {
  const { t, tr } = useI18n();
  const selected = new Set(ids);

  const toggle = (id: string, on: boolean) => {
    const nextIds = on ? [...ids, id] : ids.filter((current) => current !== id);
    const next = nextIds
      .map((nextId) => options.find((entry) => entry.id === nextId)?.label)
      .filter((label): label is Localized => Boolean(label));
    onChange(nextIds, next);
  };

  return (
    <div className="space-y-2">
      <Label>{t("admin.jobs.field.locations")}</Label>
      <p className="text-xs text-muted-foreground">{t("admin.jobs.field.locationsHint")}</p>
      <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
        {options.map((entry) => {
          return (
            <label key={entry.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.has(entry.id)}
                onCheckedChange={(checked) => toggle(entry.id, checked === true)}
              />
              <span className="truncate">{tr(entry.label)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function AdminJobsPage() {
  const { t, tr } = useI18n();
  const { taxonomies } = useTaxonomies();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<Job | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [taxOptions, setTaxOptions] = useState<{
    departments: TaxonomyOption[];
    locations: TaxonomyOption[];
    workTypes: TaxonomyOption[];
    salaries: TaxonomyOption[];
    experiences: TaxonomyOption[];
  }>({
    departments: [],
    locations: [],
    workTypes: [],
    salaries: [],
    experiences: [],
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchJobs({
      page,
      limit: PAGE_SIZE,
      status: status === ALL ? undefined : (status as JobStatus),
      search: keyword.trim() || undefined,
    })
      .then((result) => {
        if (!cancelled) {
          setJobs(result.jobs);
          setTotalCount(result.total ?? 0);
          setTotalPages(result.totalPages ?? 1);
        }
      })
      .catch(() => toast.error(t("settings.storageNote")))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, keyword, status, t]);

  // Đổi keyword/status → về trang 1, tránh trang vượt totalPages.
  useEffect(() => {
    setPage(1);
  }, [keyword, status]);

  useEffect(() => {
    let cancelled = false;
    fetchJobTaxonomies()
      .then((result) => {
        if (!cancelled) {
          setTaxOptions({
            departments: result.departments.map((t) => ({ id: t.id, label: { vi: t.label.vi, en: t.label.en } })),
            locations: result.locations.map((t) => ({ id: t.id, label: { vi: t.label.vi, en: t.label.en } })),
            workTypes: result.workTypes.map((t) => ({ id: t.id, label: { vi: t.label.vi, en: t.label.en } })),
            salaries: result.salaries.map((t) => ({ id: t.id, label: { vi: t.label.vi, en: t.label.en } })),
            experiences: result.experiences.map((t) => ({ id: t.id, label: { vi: t.label.vi, en: t.label.en } })),
          });
        }
      })
      .catch(() => toast.error(t("settings.storageNote")));
    return () => {
      cancelled = true;
    };
  }, [t]);

  // Backend trả taxonomy ID (UUID), bảng hiển thị nhãn — tra cứu từ catalogue TaxonomyProvider.
  // Lưu ý: code trong DB (slugified, ví dụ: ho-chi-minh-city/da-nang) khác code cục bộ
  // (hcmc/danang/remote-vn) — nên labelOf fallback sẽ render code thô nếu không khớp.
  const labelOf = (id: string | undefined, key: TaxonomyKey): Localized => {
    const list = taxonomies[key];
    const found = list.find((item) => item.id === id);
    if (found && (found.label?.vi || found.label?.en)) return found.label;
    return { vi: id ?? "", en: id ?? "" };
  };

  const rows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    const hasLabel = (value: Localized) => Boolean(value.vi || value.en);

    return jobs
      .map((job) => ({
        ...job,
        // API đã map label từ TaxonomyInfo; chỉ fallback catalogue cục bộ khi thiếu label.
        department: hasLabel(job.department)
          ? job.department
          : labelOf(job.departmentId, "departments"),
        locations: job.locations.length
          ? job.locations
          : (job.locationIds ?? []).map((id) => labelOf(id, "locations")),
        workType: hasLabel(job.workType)
          ? job.workType
          : labelOf(job.workTypeId, "workTypes"),
      }))
      .filter((job) =>
        needle ? `${job.title.vi} ${job.title.en}`.toLowerCase().includes(needle) : true,
      )
      .filter((job) => (status === ALL ? true : job.status === status));
  }, [jobs, keyword, status, taxonomies]);

  const patch = (partial: Partial<Job>) =>
    setDraft((current) => (current ? { ...current, ...partial } : current));

  const submit = async (statusOverride?: JobStatus) => {
    if (!draft || isSaving) return;
    setIsSaving(true);
    try {
      const payload = toApiPayload(draft, statusOverride);
      const saved = draft.id ? await updateJob(draft.id, payload) : await createJob(payload);
      setJobs((prev) => {
        const exists = prev.some((j) => j.id === saved.id);
        return exists ? prev.map((j) => (j.id === saved.id ? saved : j)) : [saved, ...prev];
      });
      toast.success(t("admin.jobs.saved"));
      setDraft(null);
      setIsNew(false);
    } catch (error) {
      console.error("submit job:", error);
      toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
    } finally {
      setIsSaving(false);
    }
  };

  const removeJob = async (id: string) => {
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success(t("admin.jobs.deleted"));
    } catch (error) {
      console.error("delete job:", error);
      toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
    }
  };

  return (
    <AdminLayout
      title={t("admin.jobs.title")}
      description={t("admin.jobs.storageNote")}
      action={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setKeyword("");
              setStatus(ALL);
              toast.success(t("admin.jobs.resetDone"));
            }}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> {t("admin.jobs.reset")}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setDraft(emptyJob());
              setIsNew(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> {t("admin.jobs.new")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-card px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("admin.jobs.search")}
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full bg-card sm:w-48" aria-label={t("admin.jobs.col.status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {t("jobs.filter.all")} — {t("admin.jobs.col.status")}
            </SelectItem>
            {(Object.keys(statusLabels) as JobStatus[]).map((key) => (
              <SelectItem key={key} value={key}>
                {tr(statusLabels[key])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 hidden flex-col overflow-hidden rounded-md border border-border bg-card md:flex">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/65 backdrop-blur-sm border-b-2 border-border/80">
            <TableRow className="h-10 hover:bg-transparent border-none">
              <TableHead className="w-14 pl-4 text-center text-xs font-semibold text-foreground/80 select-none"></TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.col.title")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.col.department")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.col.location")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.field.workType")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.field.salary")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.field.experience")}</TableHead>
              <TableHead className="text-right text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.col.applicants")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.col.deadline")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.col.featured")}</TableHead>
              <TableHead className="text-xs font-semibold text-foreground/80 select-none">{t("admin.jobs.col.status")}</TableHead>
              <TableHead className="pr-4 text-xs font-semibold text-foreground/80 select-none" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="h-[520px]">
                <TableCell colSpan={12} className="h-[520px] text-center text-sm text-muted-foreground">
                  {tr({ vi: "Chưa có tin tuyển dụng nào", en: "No job postings yet" })}
                </TableCell>
              </TableRow>
            )}
            {rows.map((job, index) => (
              <TableRow key={job.id} className="h-[52px]">
                <TableCell className="text-center tabular-nums text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </TableCell>
                <TableCell className="font-medium">{tr(job.title)}</TableCell>
                <TableCell className="text-muted-foreground">{tr(job.department)}</TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {job.locations.length > 0 ? (
                      job.locations.map((loc, index) => (
                        <Badge key={`${job.id}-loc-${index}`} variant="secondary" className="text-xs">
                          {tr(loc)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{tr(job.workType)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {job.salary.vi || job.salary.en ? tr(job.salary) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {job.experience?.vi || job.experience?.en ? tr(job.experience) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">{job.applicants}</TableCell>
                <TableCell className="text-muted-foreground">{job.deadline}</TableCell>
                <TableCell>
                  {job.featured && <Sparkles className="h-4 w-4 text-accent" />}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[job.status]}>{tr(statusLabels[job.status])}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("admin.jobs.edit")}
                    onClick={() => {
                      setDraft(structuredClone(job));
                      setIsNew(false);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("admin.jobs.delete")}
                    onClick={() => {
                      removeJob(job.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length > 0 && rows.length < PAGE_SIZE &&
              Array.from({ length: PAGE_SIZE - rows.length }).map((_, index) => (
                <TableRow
                  key={`empty-row-${index}`}
                  aria-hidden
                  className="h-[52px] border-b border-border/50 hover:bg-transparent pointer-events-none select-none"
                >
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                  <TableCell className="px-4 py-3 text-transparent">&nbsp;</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        </div>

        <div className="shrink-0 border-t border-border/70 bg-muted/30 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          {/* Phía trái: Đếm số dòng */}
          <div className="text-xs text-muted-foreground">
            {totalCount > 0 ? (
              <>
                Đang hiển thị{" "}
                <strong className="font-semibold text-foreground">
                  {(page - 1) * PAGE_SIZE + 1}
                </strong>{" "}
                -{" "}
                <strong className="font-semibold text-foreground">
                  {Math.min(page * PAGE_SIZE, totalCount)}
                </strong>{" "}
                trên tổng số{" "}
                <strong className="font-semibold text-foreground">{totalCount}</strong> dòng
              </>
            ) : (
              <span>Không có bản ghi nào</span>
            )}
          </div>

          {/* Phía phải: Cụm 4 nút chuyển trang */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Trang <strong className="font-semibold text-foreground">{page}</strong> / {totalPages || 1}
            </span>

            <div className="flex items-center gap-1">
              {/* Về đầu */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => setPage(1)}
                disabled={page <= 1 || isLoading}
                title="Trang đầu"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              {/* Lùi 1 trang */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || isLoading}
                title="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Tiến 1 trang */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages || isLoading}
                title="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Đến cuối */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md border-border/70"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || isLoading}
                title="Trang cuối"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:hidden">
        {rows.map((job) => (
          <div key={job.id} className="rounded-lg border border-border bg-card p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{tr(job.title)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {tr(job.department)} · {job.locations.map(tr).join(", ")}
                </p>
              </div>
              <Badge variant={statusVariant[job.status]} className="shrink-0">
                {tr(statusLabels[job.status])}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {job.applicants} {t("admin.jobs.col.applicants")}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraft(structuredClone(job));
                    setIsNew(false);
                  }}
                >
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> {t("admin.jobs.edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeJob(job.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDraft(null);
            setIsNew(false);
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] max-w-2xl flex flex-col p-0 overflow-hidden rounded-lg border border-border/80 shadow-2xl bg-background"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background">
            <DialogTitle>
              {Boolean(isNew)
                ? (t("admin.jobs.new") || "Tạo mới tin tuyển dụng")
                : (t("admin.jobs.edit") || "Chỉnh sửa tin tuyển dụng")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.jobs.storageNote") || "Điền đầy đủ các thông tin vị trí công việc bên dưới."}
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <form
              className="flex flex-col flex-1 overflow-hidden min-h-0"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className="flex-1 overflow-y-auto px-6 py-4 pr-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]">
                <section className="space-y-4">
                  <div className="border-b border-border pb-2 mb-4">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {t("admin.jobs.group.basic") || "Thông tin cơ bản"}
                    </p>
                  </div>
                <BiField
                  label={t("admin.jobs.col.title")}
                  value={draft.title}
                  required
                  onChange={(title) => patch({ title })}
                />
                <TaxonomyField
                  label={t("admin.jobs.col.department")}
                  options={taxOptions.departments}
                  valueId={draft.departmentId}
                  onChange={(departmentId, department) => patch({ departmentId, department })}
                />
                <LocationsField
                  options={taxOptions.locations}
                  ids={draft.locationIds ?? []}
                  onChange={(locationIds, locations) => patch({ locationIds, locations })}
                />
                <BiField
                  label={t("admin.jobs.field.summary")}
                  value={draft.summary}
                  onChange={(summary) => patch({ summary })}
                />
                </section>

              <section className="space-y-4">
                <div className="border-b border-border pb-2 mb-4 pt-2">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {t("admin.jobs.group.details") || "Chi tiết tuyển dụng"}
                    </p>
                  </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job-deadline">{t("admin.jobs.col.deadline")}</Label>
                    <Input
                      id="job-deadline"
                      type="date"
                      value={draft.deadline}
                      onChange={(e) => patch({ deadline: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-status">{t("admin.jobs.col.status")}</Label>
                    <Select
                      value={draft.status}
                      onValueChange={(value) => patch({ status: value as JobStatus })}
                    >
                      <SelectTrigger id="job-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusLabels) as JobStatus[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {tr(statusLabels[key])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-headcount">{t("admin.jobs.field.headcount")}</Label>
                    <Input
                      id="job-headcount"
                      type="number"
                      min={0}
                      value={draft.headcount ?? ""}
                      onChange={(e) =>
                        patch({
                          headcount: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-contact-name">{t("admin.jobs.field.contactName")}</Label>
                    <Input
                      id="job-contact-name"
                      value={draft.contactName ?? ""}
                      onChange={(e) => patch({ contactName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="job-contact-email">{t("admin.jobs.field.contactEmail")}</Label>
                    <Input
                      id="job-contact-email"
                      type="email"
                      value={draft.contactEmail ?? ""}
                      onChange={(e) => patch({ contactEmail: e.target.value })}
                    />
                  </div>
                </div>

                <TaxonomyField
                  label={t("admin.jobs.field.workType")}
                  options={taxOptions.workTypes}
                  valueId={draft.workTypeId}
                  onChange={(workTypeId, workType) => patch({ workTypeId, workType })}
                />
                <BiField
                  label={t("admin.jobs.field.level")}
                  value={draft.level}
                  onChange={(level) => patch({ level })}
                />
                <TaxonomyField
                  label={t("admin.jobs.field.salary")}
                  options={taxOptions.salaries}
                  valueId={draft.salaryId}
                  onChange={(salaryId, salary) => patch({ salaryId, salary })}
                />
                <TaxonomyField
                  label={t("admin.jobs.field.experience")}
                  options={taxOptions.experiences}
                  valueId={draft.experienceId}
                  onChange={(experienceId, experience) => patch({ experienceId, experience })}
                />
                <BiField
                  label={t("admin.jobs.field.languages")}
                  value={draft.languages ?? { vi: "", en: "" }}
                  onChange={(languages) => patch({ languages })}
                />

                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <Label htmlFor="job-featured">{t("admin.jobs.field.featured")}</Label>
                  <Switch
                    id="job-featured"
                    checked={draft.featured}
                    onCheckedChange={(featured) => patch({ featured })}
                  />
                </div>
              </section>

                <section className="space-y-4">
                  <div className="border-b border-border pb-2 mb-4 pt-2">
                    <p className="font-display text-sm font-semibold text-foreground">
                      {t("admin.jobs.group.content") || "Nội dung chi tiết"}
                    </p>
                  </div>
                  <BiField
                    label={t("admin.jobs.field.description")}
                    value={draft.description ?? emptyLocalized}
                    multiline
                    onChange={(description) => patch({ description })}
                  />
                  <BiField
                    label={t("admin.jobs.field.requirements")}
                    value={draft.requirements ?? emptyLocalized}
                    multiline
                    onChange={(requirements) => patch({ requirements })}
                  />
                  <BiField
                    label={t("admin.jobs.field.benefits")}
                    value={draft.benefits ?? emptyLocalized}
                    multiline
                    onChange={(benefits) => patch({ benefits })}
                  />
                </section>
              </div>

              <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-md gap-2 h-9 px-4 text-xs font-medium tracking-wide shadow-xs transition-all active:scale-[0.99] hover:bg-muted text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setDraft(null);
                    setIsNew(false);
                  }}
                >
                  <X className="h-4 w-4" />
                  {t("common.cancel") || "Hủy"}
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-md gap-2 h-9 px-4 text-xs font-medium tracking-wide shadow-xs transition-all active:scale-[0.99] border-border/70 hover:bg-accent"
                    disabled={isSaving}
                    onClick={() => submit("draft")}
                  >
                    <FileText className="h-4 w-4" />
                    {t("admin.jobs.actions.saveDraft") || "Lưu nháp"}
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-md gap-2 h-9 px-4 min-w-[120px] text-xs font-medium tracking-wide shadow-xs transition-all active:scale-[0.99] hover:shadow-sm"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {isSaving
                      ? "Đang lưu..."
                      : Boolean(isNew)
                        ? (t("admin.jobs.actions.save") || "Tạo mới")
                        : (t("common.save") || "Lưu thay đổi")}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
