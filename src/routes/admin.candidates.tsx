import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Mail, MapPin, Phone, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  candidates as seedCandidates,
  stageLabels,
  stageOrder,
  type Candidate,
  type Stage,
} from "@/data/candidates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getJob, jobs } from "@/data/jobs";
import { useI18n } from "@/lib/i18n";
import { useInbox } from "@/lib/inbox-store";
import { useJobs } from "@/lib/jobs-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/candidates")({
  head: () => ({
    meta: [
      { title: "Ứng viên — TalentHub HR" },
      {
        name: "description",
        content: "Danh sách ứng viên, hồ sơ chi tiết, CV, ghi chú nội bộ và giai đoạn tuyển dụng.",
      },
      { property: "og:title", content: "Ứng viên — TalentHub HR" },
      {
        property: "og:description",
        content: "Hồ sơ ứng viên, CV, ghi chú nội bộ và giai đoạn tuyển dụng.",
      },
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
  const { t, tr } = useI18n();
  const { openApplications } = useInbox();
  const [list, setList] = useState<Candidate[]>(seedCandidates);
  const [keyword, setKeyword] = useState("");
  const [jobFilter, setJobFilter] = useState(ALL);
  const [stageFilter, setStageFilter] = useState(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return list
      .filter((c) => (needle ? `${c.name} ${c.email}`.toLowerCase().includes(needle) : true))
      .filter((c) => (jobFilter === ALL ? true : c.jobId === jobFilter))
      .filter((c) => (stageFilter === ALL ? true : c.stage === stageFilter));
  }, [list, keyword, jobFilter, stageFilter]);

  const selected = list.find((c) => c.id === selectedId) ?? null;

  function changeStage(id: string, stage: Stage) {
    setList((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
    toast.success(tr(stageLabels[stage]));
  }

  return (
    <AdminLayout title={t("admin.candidates.title")} description={t("admin.demoNote")}>
      <Tabs defaultValue="applicants">
        <TabsList className="flex-wrap">
          <TabsTrigger value="applicants">
            {tr({ vi: "Ứng viên theo tin", en: "Job applicants" })}
          </TabsTrigger>
          <TabsTrigger value="open">
            {tr({ vi: "Hồ sơ tự do", en: "Open applications" })} ({openApplications.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-5">
          <OpenApplicationsPanel />
        </TabsContent>
        <TabsContent value="applicants" className="mt-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
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

      {rows.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("admin.candidates.empty")}
        </p>
      ) : (
        <>
          <div className="mt-5 hidden overflow-hidden rounded-lg border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.candidates.col.name")}</TableHead>
                  <TableHead>{t("admin.candidates.col.job")}</TableHead>
                  <TableHead>{t("admin.candidates.col.stage")}</TableHead>
                  <TableHead>{t("admin.candidates.col.rating")}</TableHead>
                  <TableHead>{t("admin.candidates.col.applied")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((candidate) => {
                  const job = getJob(candidate.jobId);
                  return (
                    <TableRow
                      key={candidate.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(candidate.id)}
                    >
                      <TableCell>
                        <span className="block font-medium">{candidate.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {candidate.email}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {job ? tr(job.title) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tr(stageLabels[candidate.stage])}</Badge>
                      </TableCell>
                      <TableCell>
                        <Rating value={candidate.rating} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{candidate.appliedAt}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 grid gap-3 md:hidden">
            {rows.map((candidate) => {
              const job = getJob(candidate.jobId);
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
                        {job ? tr(job.title) : "—"}
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
        </>
      )}
        </TabsContent>
      </Tabs>


      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {t("admin.candidates.profile")} · {tr(selected.experience)}
                </DialogDescription>
              </DialogHeader>

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
                  value={selected.stage}
                  onValueChange={(value) => changeStage(selected.id, value as Stage)}
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
                <Textarea rows={3} maxLength={500} placeholder={t("admin.candidates.notes")} />
                <Button size="sm" onClick={() => toast.success(t("admin.demoNote"))}>
                  {t("common.save")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
