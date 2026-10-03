import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  stageLabels,
  stageOrder,
  type Candidate,
  type Stage,
} from "@/data/candidates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getJob, jobs } from "@/data/jobs";
import { translate, useI18n } from "@/lib/i18n";
import { adminCandidateApi } from "@/services/admin-candidate.api";

const PAGE_SIZE = 10;
const getSafeMetaText = (key: Parameters<typeof translate>[0], fallback: string) =>
  translate(key, fallback) || fallback;
import { useInbox } from "@/lib/inbox-store";
import { useJobs } from "@/lib/jobs-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/candidates")({
  head: () => ({
    meta: [
      {
        title: getSafeMetaText(
          "admin.candidates.meta.title",
          "Ứng viên — TalentHub HR",
        ),
      },
      {
        name: "description",
        content: getSafeMetaText(
          "admin.candidates.meta.description",
          "Danh sách ứng viên, hồ sơ chi tiết, CV, ghi chú nội bộ và giai đoạn tuyển dụng.",
        ),
      },
      {
        property: "og:title",
        content: getSafeMetaText("admin.candidates.meta.title", "Ứng viên — TalentHub HR"),
      },
      {
        property: "og:description",
        content: getSafeMetaText(
          "admin.candidates.meta.ogDescription",
          "Hồ sơ ứng viên, CV, ghi chú nội bộ và giai đoạn tuyển dụng.",
        ),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCandidatesPage,
});

const ALL = "__all__";

function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= value ? "fill-accent text-accent" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

function OpenApplicationsPanel() {
  const { tr } = useI18n();
  const { openApplications, assignApplication, deleteOpenApplication } = useInbox();
  const { jobs: liveJobs } = useJobs();

  if (openApplications.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {tr({ vi: "Chưa có hồ sơ tự do nào.", en: "No open applications yet." })}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {openApplications.map((item) => (
        <div key={item.id} className="rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{item.name}</p>
                <Badge variant="secondary">{tr({ vi: "Hồ sơ tự do", en: "Open" })}</Badge>
                {item.assignedJobId && (
                  <Badge variant="outline">
                    {tr(getJob(item.assignedJobId)?.title ?? { vi: "Đã gán", en: "Assigned" })}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.email}
                {item.phone ? ` · ${item.phone}` : ""} · {item.createdAt}
              </p>
              {item.fileName && (
                <p className="mt-2 flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-accent" /> {item.fileName}
                </p>
              )}
              {item.note && <p className="mt-2 text-sm text-muted-foreground">{item.note}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Select
                value={item.assignedJobId ?? ""}
                onValueChange={(value) => {
                  assignApplication(item.id, value);
                  toast.success(tr({ vi: "Đã gán vào tin", en: "Assigned to job" }));
                }}
              >
                <SelectTrigger className="w-56 bg-card">
                  <SelectValue placeholder={tr({ vi: "Gán vào tin", en: "Assign to job" })} />
                </SelectTrigger>
                <SelectContent>
                  {liveJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {tr(job.title)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteOpenApplication(item.id)}
              >
                {tr({ vi: "Xóa", en: "Delete" })}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminCandidatesPage() {
  const { t, tr, lang } = useI18n();
  const { openApplications } = useInbox();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [keyword, setKeyword] = useState("");
  const [jobFilter, setJobFilter] = useState(ALL);
  const [stageFilter, setStageFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editStage, setEditStage] = useState<Stage>("new");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    document.title = getSafeMetaText("admin.candidates.meta.title", "Ứng viên — TalentHub HR");
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    adminCandidateApi.getCandidates({
      page,
      pageSize: PAGE_SIZE,
      search: keyword.trim() || undefined,
      jobId: jobFilter === ALL ? undefined : jobFilter,
      status: stageFilter === ALL ? undefined : (stageFilter as Stage),
    })
      .then((result) => {
        if (cancelled) return;
        setCandidates(result.candidates);
        setTotalCount(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, keyword, jobFilter, stageFilter, t]);

  useEffect(() => {
    setPage(1);
  }, [keyword, jobFilter, stageFilter]);

  const selected = candidates.find((c) => c.id === selectedId) ?? null;
  const handleRowClick = (candidate: Candidate) => {
    setSelectedId(candidate.id);
    setEditStage(candidate.stage);
    setEditNotes(candidate.notes[0]?.body.vi ?? "");
  };
  const emptyRowsCount = candidates.length > 0 && candidates.length < PAGE_SIZE
    ? PAGE_SIZE - candidates.length
    : 0;

  async function changeStage(id: string, stage: Stage) {
    if (savingId) return;
    const previous = candidates.find((candidate) => candidate.id === id)?.stage;
    if (!previous || previous === stage) return;

    setSavingId(id);
    try {
      const updated = await adminCandidateApi.updateStatus(id, stage);
      setCandidates((prev) => prev.map((candidate) => (
        candidate.id === id ? updated : candidate
      )));
      toast.success(t("admin.candidates.stageUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.candidates.stageUpdateFailed"));
    } finally {
      setSavingId(null);
    }
  }

  async function submitCandidate() {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await adminCandidateApi.updateCandidate(selected.id, {
        name: selected.name,
        email: selected.email,
        phone: selected.phone,
        cvFile: selected.cvFile,
        jobId: selected.jobId,
        status: editStage,
        notes: editNotes,
      });
      setCandidates((prev) => prev.map((candidate) => (
        candidate.id === updated.id ? updated : candidate
      )));
      toast.success(t("admin.candidates.saved"));
      setSelectedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.candidates.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout title={t("admin.candidates.title")} description={t("admin.demoNote")}>
      <Tabs defaultValue="applicants" className="flex min-h-0 flex-1 flex-col space-y-3.5 overflow-hidden">
        <div className="flex items-center justify-start">
          <TabsList className="shrink-0">
            <TabsTrigger value="applicants">
              {tr({ vi: "Ứng viên theo tin", en: "Job applicants" })}
            </TabsTrigger>
            <TabsTrigger value="open">
              {tr({ vi: "Hồ sơ tự do", en: "Open applications" })} ({openApplications.length})
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="open" className="mt-5 min-h-0 flex-1 overflow-auto">
          <OpenApplicationsPanel />
        </TabsContent>
        <TabsContent value="applicants" className="flex min-h-0 flex-1 flex-col space-y-3.5 overflow-hidden">
      <div className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("admin.candidates.search")}
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="bg-card" aria-label={t("admin.candidates.filter.job")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {t("jobs.filter.all")} — {t("admin.candidates.filter.job")}
            </SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {tr(job.title)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="bg-card" aria-label={t("admin.candidates.filter.stage")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {t("jobs.filter.all")} — {t("admin.candidates.filter.stage")}
            </SelectItem>
            {stageOrder.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {tr(stageLabels[stage])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs md:flex">
        <div className="shrink-0 overflow-hidden rounded-t-xl border-b-2 border-border/80 bg-muted/60 backdrop-blur-sm">
          <Table className="table-fixed w-full">
            <TableHeader className="bg-transparent">
              <TableRow className="h-10 border-none hover:bg-transparent">
                <TableHead className="w-[60px] text-center text-xs font-semibold text-foreground/80 select-none">
                  {t("common.table.stt")}
                </TableHead>
                <TableHead className="w-[240px] pl-4 text-xs font-semibold text-foreground/80 select-none">
                  {t("admin.candidates.col.name")}
                </TableHead>
                <TableHead className="w-[200px] text-xs font-semibold text-foreground/80 select-none">
                  {t("admin.candidates.col.job")}
                </TableHead>
                <TableHead className="w-[140px] text-xs font-semibold text-foreground/80 select-none">
                  {t("admin.candidates.col.stage")}
                </TableHead>
                <TableHead className="w-[130px] text-xs font-semibold text-foreground/80 select-none">
                  {t("admin.candidates.col.applied")}
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-foreground/80 select-none">
                  {t("admin.candidates.cv")}
                </TableHead>
                <TableHead className="w-[100px] pr-4 text-xs font-semibold text-foreground/80 select-none">
                  {t("admin.candidates.actions.detail")}
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
                  <TableCell colSpan={7} className="p-2 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && candidates.length === 0 && (
                <TableRow className="h-full">
                  <TableCell colSpan={7} className="p-2 text-center text-sm text-muted-foreground">
                    {t("admin.candidates.empty")}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                candidates.map((candidate, index) => {
                  const job = getJob(candidate.jobId);
                  const jobTitle = candidate.jobTitle ?? job?.title;
                  return (
                    <TableRow
                      key={candidate.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(candidate)}
                    >
                      <TableCell className="w-[60px] text-center text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell className="w-[240px] pl-4">
                        <span className="block truncate font-medium">{candidate.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {candidate.email}
                        </span>
                      </TableCell>
                      <TableCell className="w-[200px] truncate text-muted-foreground">
                        {jobTitle ? tr(jobTitle) : "—"}
                      </TableCell>
                      <TableCell className="w-[140px]">
                        <Badge variant="secondary">{tr(stageLabels[candidate.stage])}</Badge>
                      </TableCell>
                      <TableCell className="w-[130px] text-muted-foreground">
                        {candidate.appliedAt}
                      </TableCell>
                      <TableCell className="w-[110px]">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={(event) => {
                            event.stopPropagation();
                            toast.info(candidate.cvFile || t("admin.candidates.cv"));
                          }}
                        >
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          {t("admin.candidates.cv")}
                        </Button>
                      </TableCell>
                      <TableCell className="w-[100px] pr-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          title={t("common.actions.view") || "Xem chi tiết"}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRowClick(candidate);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Xem chi tiết</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {!isLoading && emptyRowsCount > 0 &&
                Array.from({ length: emptyRowsCount }).map((_, index) => (
                  <TableRow
                    key={`empty-row-${index}`}
                    aria-hidden
                    className="border-b border-border/50 hover:bg-transparent pointer-events-none select-none"
                  >
                    <TableCell className="py-3 px-4 w-[60px] text-transparent">&nbsp;</TableCell>
                    <TableCell className="py-3 px-4 w-[240px] text-transparent">&nbsp;</TableCell>
                    <TableCell className="py-3 px-4 w-[200px] text-transparent">&nbsp;</TableCell>
                    <TableCell className="py-3 px-4 w-[140px] text-transparent">&nbsp;</TableCell>
                    <TableCell className="py-3 px-4 w-[130px] text-transparent">&nbsp;</TableCell>
                    <TableCell className="py-3 px-4 w-[110px] text-transparent">&nbsp;</TableCell>
                    <TableCell className="py-3 px-4 w-[100px] text-transparent">&nbsp;</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        <div className="shrink-0 border-t border-border/70 bg-muted/30 px-4 py-3 flex items-center justify-between gap-3 select-none">
          {/* Phía trái: Đếm số dòng */}
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

          {/* Phía phải: Cụm 4 nút chuyển trang */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {t("admin.jobs.footer.page")}{" "}
              <strong className="font-semibold text-foreground">{page}</strong> / {totalPages || 1}
            </span>

            <div className="flex items-center gap-1">
              {/* Về đầu */}
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

              {/* Lùi 1 trang */}
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

              {/* Tiến 1 trang */}
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

              {/* Đến cuối */}
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

      <div className="mt-5 grid gap-3 md:hidden">
            {candidates.map((candidate) => {
              const job = getJob(candidate.jobId);
              const jobTitle = candidate.jobTitle ?? job?.title;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setSelectedId(candidate.id)}
                  className="rounded-lg border border-border bg-card p-4 text-left"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{candidate.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {jobTitle ? tr(jobTitle) : "—"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {tr(stageLabels[candidate.stage])}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Rating value={candidate.rating} />
                    <span className="text-xs text-muted-foreground">{candidate.appliedAt}</span>
                  </div>
                </button>
              );
            })}
      </div>
        </TabsContent>
      </Tabs>


      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent
          className="max-h-[85vh] overflow-hidden rounded-xl border border-border p-0 shadow-lg sm:max-w-[620px]"
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          {selected && (
            <form
              className="flex max-h-[85vh] flex-col overflow-hidden"
              onSubmit={(event) => {
                event.preventDefault();
                submitCandidate();
              }}
            >
              <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4">
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {t("admin.candidates.profile")} · {tr(selected.experience)}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selected.email}</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" /> {selected.phone}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" /> {tr(selected.location)}
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4 shrink-0" />
                  <Rating value={selected.rating} />
                </span>
              </div>

              <div className="rounded-md border border-border bg-surface p-4">
                <p className="text-xs text-muted-foreground">{t("admin.candidates.cv")}</p>
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">{selected.cvFile}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => toast.info(t("admin.demoNote"))}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> {t("common.download")}
                  </Button>
                </div>
              </div>

              {selected.highlights.length > 0 && (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {selected.highlights.map((item) => (
                    <li key={item.en} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {tr(item)}
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2">
                <Label htmlFor="stage">{t("admin.candidates.changeStage")}</Label>
                <Select
                  value={editStage}
                  onValueChange={(value) => setEditStage(value as Stage)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOrder.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {tr(stageLabels[stage])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">{t("admin.candidates.notes")}</p>
                {selected.notes.length > 0 && (
                  <ul className="space-y-3">
                    {selected.notes.map((note) => (
                      <li key={note.at} className="rounded-md border border-border p-3">
                        <p className="text-xs text-muted-foreground">
                          {note.author} · {note.at}
                        </p>
                        <p className="mt-1 text-sm">{tr(note.body)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Textarea
                  rows={3}
                  maxLength={500}
                  placeholder={t("admin.candidates.notes")}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              </div>

              <DialogFooter className="shrink-0 border-t border-border/70 bg-muted/20 px-6 py-3.5 flex flex-row items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3.5 text-xs rounded-md border-border/70 hover:bg-muted gap-1.5"
                  disabled={isSubmitting}
                  onClick={() => setSelectedId(null)}
                >
                  <X className="h-3.5 w-3.5" />
                  {t("common.cancel") || "Hủy"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 px-4 text-xs font-medium rounded-md gap-1.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {t("common.save") || "Lưu thay đổi"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}
