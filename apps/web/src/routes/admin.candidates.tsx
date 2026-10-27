import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
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
  stageLabels,
  stageOrder,
  type Candidate,
  type Stage,
} from "@/data/candidates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getJob, type Job } from "@/data/jobs";
import { fetchJobs } from "@/lib/api/jobs";
import { useI18n } from "@/lib/i18n";
import { adminCandidateApi } from "@/services/admin-candidate.api";
import { createRouteMeta } from "@/lib/route-meta";

const PAGE_SIZE = 10;

import type { TaxonomyItem } from "@/lib/taxonomy-store";
import { cn } from "@/lib/utils";
import { requireAdminSession } from "@/lib/admin-route-guard";

export const Route = createFileRoute("/admin/candidates")({
  beforeLoad: ({ location }) => requireAdminSession(location.pathname),
  head: createRouteMeta({
    titleKey: "admin.candidates.meta.title",
    descriptionKey: "admin.candidates.meta.description",
    ogDescriptionKey: "admin.candidates.meta.ogDescription",
    noIndex: true,
  }),
  component: AdminCandidatesPage,
});

const ALL = "__all__";

function isPdfFile(value: string): boolean {
  return /\.pdf(?:$|[?#])/i.test(value);
}

type CvPreview = {
  candidateId: string;
  candidateName: string;
  fileName: string;
  url: string;
  isLoading: boolean;
};

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

function OpenApplicationsPanel({
  items,
  isLoading,
  jobs,
  onAssign,
  onDelete,
  onViewCv,
  onDownloadCv,
}: {
  items: Candidate[];
  isLoading: boolean;
  jobs: Job[];
  onAssign: (id: string, jobId: string) => void;
  onDelete: (id: string) => void;
  onViewCv: (candidate: Candidate) => void;
  onDownloadCv: (candidate: Candidate) => void;
}) {
  const { t, tr } = useI18n();

  if (!isLoading && items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {tr({ vi: "Chưa có hồ sơ tự do nào.", en: "No open applications yet." })}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const noteBody = item.notes[0]?.body;
        return (
          <div key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.name}</p>
                  <Badge variant="secondary">{tr({ vi: "Hồ sơ tự do", en: "Open" })}</Badge>
                  {item.jobId && (
                    <Badge variant="outline">
                      {tr(item.jobTitle ?? getJob(item.jobId)?.title ?? { vi: "Đã gán", en: "Assigned" })}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.email}
                  {item.phone ? ` · ${item.phone}` : ""} · {item.appliedAt}
                </p>
                {item.cvFile && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 max-w-full px-2"
                      onClick={() => onViewCv(item)}
                    >
                      <FileText className="mr-1 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="truncate">{item.cvFile.split("/").pop()}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title={t("common.download") || "Tải xuống"}
                      onClick={() => onDownloadCv(item)}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">{t("common.download") || "Tải xuống"}</span>
                    </Button>
                  </div>
                )}
                {noteBody && <p className="mt-2 text-sm text-muted-foreground">{tr(noteBody)}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Select
                  value={item.jobId ?? ""}
                  onValueChange={(value) => {
                    onAssign(item.id, value);
                    toast.success(tr({ vi: "Đã gán vào tin", en: "Assigned to job" }));
                  }}
                >
                  <SelectTrigger className="w-56 bg-card">
                    <SelectValue placeholder={tr({ vi: "Gán vào tin", en: "Assign to job" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {tr(job.title)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>
                  {tr({ vi: "Xóa", en: "Delete" })}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminCandidatesPage() {
  const { t, tr } = useI18n();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filterJobs, setFilterJobs] = useState<import("@/data/jobs").Job[]>([]);
  const [filterExperiences, setFilterExperiences] = useState<TaxonomyItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [jobFilter, setJobFilter] = useState(ALL);
  const [experienceFilter, setExperienceFilter] = useState(ALL);
  const [stageFilter, setStageFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editStage, setEditStage] = useState<Stage>("new");
  const [editRating, setEditRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [editNoteBody, setEditNoteBody] = useState("");
  const [cvPreview, setCvPreview] = useState<CvPreview | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const cvObjectUrlRef = useRef<string | null>(null);

  // Giải phóng object URL của blob CV khi đóng dialog / unmount để tránh rò rỉ bộ nhớ.
  useEffect(() => {
    return () => {
      if (cvObjectUrlRef.current) {
        URL.revokeObjectURL(cvObjectUrlRef.current);
        cvObjectUrlRef.current = null;
      }
    };
  }, []);

  async function openCvPreview(candidate: { id: string; name: string; cvFile: string }) {
    if (!candidate.cvFile) return;
    const fileName = candidate.cvFile.split("/").pop() ?? candidate.cvFile;
    if (cvObjectUrlRef.current) {
      URL.revokeObjectURL(cvObjectUrlRef.current);
      cvObjectUrlRef.current = null;
    }
    setCvPreview({
      candidateId: candidate.id,
      candidateName: candidate.name,
      fileName,
      url: "",
      isLoading: true,
    });
    try {
      const blob = await adminCandidateApi.getCvBlob(candidate.id);
      const objectUrl = URL.createObjectURL(blob);
      cvObjectUrlRef.current = objectUrl;
      setCvPreview((prev) =>
        prev && prev.candidateId === candidate.id
          ? { ...prev, url: objectUrl, isLoading: false }
          : prev,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
      setCvPreview(null);
    }
  }

  async function downloadCv(candidate: { id: string; name: string; cvFile: string }) {
    if (!candidate.cvFile || isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await adminCandidateApi.getCvBlob(candidate.id);
      const fileName = candidate.cvFile.split("/").pop() ?? candidate.cvFile;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
    } finally {
      setIsDownloading(false);
    }
  }

  // Dropdown lọc cần jobId dạng UUID của database để khớp Candidate.jobId.
  useEffect(() => {
    let cancelled = false;
    fetchJobs({ limit: 100 })
      .then((result) => {
        if (!cancelled) setFilterJobs(result.jobs);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    adminCandidateApi.getExperienceTaxonomies()
      .then((items) => {
        if (!cancelled) setFilterExperiences(items.map((item) => ({
          id: item.id,
          label: { vi: item.label.vi, en: item.label.en },
        })));
      })
      .catch(() => {
        if (!cancelled) setFilterExperiences([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    adminCandidateApi.getCandidates({
      page,
      pageSize: PAGE_SIZE,
      search: keyword.trim() || undefined,
      jobId: jobFilter === ALL ? undefined : jobFilter,
      experienceId: experienceFilter === ALL ? undefined : experienceFilter,
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
  }, [page, keyword, jobFilter, experienceFilter, stageFilter, reloadToken, t]);

  useEffect(() => {
    setPage(1);
  }, [keyword, jobFilter, experienceFilter, stageFilter]);

  const [openApplications, setOpenApplications] = useState<Candidate[]>([]);
  const [isOpenLoading, setIsOpenLoading] = useState(false);
  const [openReloadToken, setOpenReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsOpenLoading(true);
    adminCandidateApi
      .getOpenApplications({ pageSize: 100 })
      .then((result) => {
        if (!cancelled) setOpenApplications(result.candidates);
      })
      .catch((error) => {
        if (!cancelled)
          toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
      })
      .finally(() => {
        if (!cancelled) setIsOpenLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openReloadToken, t]);

  const reloadOpenApplications = () => setOpenReloadToken((prev) => prev + 1);

  async function handleAssignOpen(id: string, jobId: string) {
    try {
      await adminCandidateApi.assignOpenApplication(id, jobId);
      reloadOpenApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
    }
  }

  async function handleDeleteOpen(id: string) {
    try {
      await adminCandidateApi.deleteOpenApplication(id);
      reloadOpenApplications();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("settings.storageNote"));
    }
  }

  const selected = candidates.find((c) => c.id === selectedId) ?? null;
  const handleRowClick = (candidate: Candidate) => {
    setSelectedId(candidate.id);
    setEditStage(candidate.stage);
    setEditRating(candidate.rating);
    setHoveredRating(0);
    setEditNoteBody("");
  };

  // Keep the edit value in sync with the selected row after list reloads or save responses.
  useEffect(() => {
    setEditRating(selected ? selected.rating : null);
  }, [selected?.id, selected?.rating]);
  async function submitCandidate() {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await adminCandidateApi.updateCandidate(selected.id, {
        name: selected.name,
        email: selected.email,
        phone: selected.phone,
        ...(selected.address ? { address: selected.address } : {}),
        cvFile: selected.cvFile,
        jobId: selected.jobId,
        status: editStage,
        rating: editRating ?? selected.rating,
        notes: editNoteBody.trim()
          ? [
              ...selected.notes,
              {
                author: "",
                at: "",
                body: { vi: editNoteBody.trim(), en: editNoteBody.trim() },
              },
            ]
          : selected.notes,
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

  const columns: AdminColumn<Candidate>[] = [
    {
      header: t("admin.candidates.col.name"),
      className: "w-[240px] pl-4",
      cell: (candidate) => (
        <>
          <span className="block truncate font-medium">{candidate.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{candidate.email}</span>
        </>
      ),
    },
    {
      header: t("admin.candidates.col.job"),
      className: "w-[200px] truncate text-muted-foreground",
      cell: (candidate) => {
        const jobTitle = candidate.jobTitle ?? (candidate.jobId ? getJob(candidate.jobId)?.title : undefined);
        return jobTitle ? tr(jobTitle) : "—";
      },
    },
    { header: t("admin.candidates.col.stage"), className: "w-[140px]", cell: (candidate) => <Badge variant="secondary">{tr(stageLabels[candidate.stage])}</Badge> },
    { header: t("admin.candidates.col.applied"), className: "w-[130px] text-muted-foreground", cell: (candidate) => candidate.appliedAt },
    {
      header: t("admin.candidates.cv"),
      className: "w-[110px]",
      cell: (candidate) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={(event) => {
            event.stopPropagation();
            void openCvPreview(candidate);
          }}
          disabled={!candidate.cvFile}
        >
          <FileText className="mr-1 h-3.5 w-3.5" />
          {t("admin.candidates.cv")}
        </Button>
      ),
    },
    {
      header: tr({ vi: "Hành động", en: "Actions" }),
      className: "w-[100px] text-center",
      cell: (candidate) => (
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
      ),
    },
  ];

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
          <OpenApplicationsPanel
            items={openApplications}
            isLoading={isOpenLoading}
            jobs={filterJobs}
            onAssign={handleAssignOpen}
            onDelete={handleDeleteOpen}
            onViewCv={(candidate) => void openCvPreview(candidate)}
            onDownloadCv={(candidate) => void downloadCv(candidate)}
          />
        </TabsContent>
        <TabsContent value="applicants" className="flex min-h-0 flex-1 flex-col space-y-3.5 overflow-hidden">
      <div className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
            <SelectValue>
              {jobFilter === ALL
                ? `${t("jobs.filter.all")} — ${t("admin.candidates.filter.job")}`
                : tr(filterJobs.find((job) => job.id === jobFilter)?.title ?? { vi: "", en: "" })}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {t("jobs.filter.all")} — {t("admin.candidates.filter.job")}
            </SelectItem>
            {filterJobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {tr(job.title)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={experienceFilter} onValueChange={setExperienceFilter}>
          <SelectTrigger className="bg-card" aria-label={t("admin.candidates.filter.experience")}>
            <SelectValue>
              {experienceFilter === ALL
                ? `${t("jobs.filter.all")} — ${t("admin.candidates.filter.experience")}`
                : tr(
                    filterExperiences.find((item) => item.id === experienceFilter)?.label ?? {
                      vi: "",
                      en: "",
                    },
                  )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {t("jobs.filter.all")} — {t("admin.candidates.filter.experience")}
            </SelectItem>
            {filterExperiences.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {tr(item.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="bg-card" aria-label={t("admin.candidates.filter.stage")}>
            <SelectValue>
              {stageFilter === ALL
                ? `${t("jobs.filter.all")} — ${t("admin.candidates.filter.stage")}`
                : tr(stageLabels[stageFilter as Stage])}
            </SelectValue>
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

      <AdminDataTable
        columns={columns}
        rows={candidates}
        loading={isLoading}
        emptyMessage={t("admin.candidates.empty")}
        rowClassName="cursor-pointer hover:bg-muted/50 transition-colors"
        rowKey={(candidate) => candidate.id}
        onRowClick={handleRowClick}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onRefresh={() => setReloadToken((n) => n + 1)}
        renderCard={(candidate) => {
          const job = candidate.jobId ? getJob(candidate.jobId) : undefined;
          const jobTitle = candidate.jobTitle ?? job?.title;
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => handleRowClick(candidate)}
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
        }}
      />
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
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selected.address || tr(selected.location)}</span>
                </span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4 shrink-0" />
                  <div
                    role="group"
                    aria-label={tr({ vi: "Đánh giá ứng viên", en: "Candidate rating" })}
                    className="flex items-center"
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        aria-label={tr({ vi: `${rating} sao`, en: `${rating} stars` })}
                        aria-pressed={editRating === rating}
                        disabled={isSubmitting}
                        onMouseEnter={() => setHoveredRating(rating)}
                        onFocus={() => setHoveredRating(rating)}
                        onBlur={() => setHoveredRating(0)}
                        onClick={() => setEditRating(rating)}
                        className="rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
                      >
                        <Star
                          aria-hidden="true"
                          className={cn(
                            "h-5 w-5 transition-colors",
                            rating <= (hoveredRating || editRating || 0)
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/40",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-surface p-4">
                <p className="text-xs text-muted-foreground">{t("admin.candidates.cv")}</p>
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">{selected.cvFile}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={!selected.cvFile}
                      onClick={() => void openCvPreview(selected)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> {t("admin.candidates.cvViewer.title")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={!selected.cvFile || isDownloading}
                      onClick={() => void downloadCv(selected)}
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                      )}{" "}
                      {t("common.download")}
                    </Button>
                  </div>
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
                    {selected.notes.map((note, index) => (
                      <li
                        key={`${note.at}-${index}`}
                        className="rounded-md border border-border p-3"
                      >
                        <p className="text-xs text-muted-foreground">
                          {note.author || t("admin.demoNote")} · {note.at}
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
                  value={editNoteBody}
                  onChange={(e) => setEditNoteBody(e.target.value)}
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

      <Dialog
        open={cvPreview !== null}
        onOpenChange={(open) => {
          if (open) return;
          if (cvObjectUrlRef.current) {
            URL.revokeObjectURL(cvObjectUrlRef.current);
            cvObjectUrlRef.current = null;
          }
          setCvPreview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-[900px]">
          {cvPreview && (
            <div className="flex max-h-[90vh] flex-col">
              <DialogHeader className="shrink-0 border-b border-border/70 px-6 py-4">
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-accent" />
                  {t("admin.candidates.cvViewer.title")}
                </DialogTitle>
                <DialogDescription className="truncate">{cvPreview.candidateName} · {cvPreview.fileName}</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 p-4">
                {cvPreview.isLoading ? (
                  <div className="flex h-[65vh] min-h-[360px] items-center justify-center rounded-md border border-border bg-muted/20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : isPdfFile(cvPreview.fileName) ? (
                  <iframe
                    title={`${t("admin.candidates.cvViewer.title")} - ${cvPreview.fileName}`}
                    src={cvPreview.url}
                    className="h-[65vh] min-h-[360px] w-full rounded-md border border-border bg-muted/20"
                  />
                ) : (
                  <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-muted/20 p-6 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <p className="max-w-md text-sm text-muted-foreground">
                      {t("admin.candidates.cvViewer.unsupported")}
                    </p>
                    <Button type="button" asChild>
                      <a href={cvPreview.url} download={cvPreview.fileName}>
                        <Download className="mr-1.5 h-4 w-4" />
                        {t("common.download")}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}
