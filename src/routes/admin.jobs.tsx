import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  LocalizedField as BiField,
  LocalizedListField as BiListField,
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
import { Textarea } from "@/components/ui/textarea";
import type { Job, JobStatus } from "@/data/jobs";
import { useI18n, type Localized } from "@/lib/i18n";
import { emptyJob, makeJobId, useJobs } from "@/lib/jobs-store";
import { useTaxonomies, type TaxonomyKey } from "@/lib/taxonomy-store";

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

/** Pick a value from a shared catalogue. */
function TaxonomyField({
  label,
  taxonomyKey,
  valueId,
  onChange,
}: {
  label: string;
  taxonomyKey: TaxonomyKey;
  valueId?: string | undefined;
  onChange: (id: string, next: Localized) => void;
}) {
  const { taxonomies } = useTaxonomies();
  const list = taxonomies[taxonomyKey];
  const match = list.find((entry) => entry.id === valueId);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={match?.id ?? ""}
        onValueChange={(next) => {
          const picked = list.find((entry) => entry.id === next);
          if (picked) onChange(picked.id, { ...picked.label });
        }}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {list.map((entry) => (
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

/** Pick several work locations from the catalogue, plus free-text additions. */
function LocationsField({
  ids,
  onChange,
}: {
  ids: string[];
  onChange: (ids: string[], next: Localized[]) => void;
}) {
  const { t, tr } = useI18n();
  const { taxonomies } = useTaxonomies();
  const selected = new Set(ids);

  const toggle = (id: string, on: boolean) => {
    const nextIds = on ? [...ids, id] : ids.filter((current) => current !== id);
    const next = nextIds
      .map((nextId) => taxonomies.locations.find((entry) => entry.id === nextId)?.label)
      .filter((label): label is Localized => Boolean(label));
    onChange(nextIds, next);
  };

  return (
    <div className="space-y-2">
      <Label>{t("admin.jobs.field.locations")}</Label>
      <p className="text-xs text-muted-foreground">{t("admin.jobs.field.locationsHint")}</p>
      <div className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
        {taxonomies.locations.map((entry) => {
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
  const { jobs, saveJob, deleteJob, resetJobs } = useJobs();
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [draft, setDraft] = useState<Job | null>(null);
  const [isNew, setIsNew] = useState(false);

  const rows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return jobs
      .filter((job) =>
        needle ? `${job.title.vi} ${job.title.en}`.toLowerCase().includes(needle) : true,
      )
      .filter((job) => (status === ALL ? true : job.status === status));
  }, [jobs, keyword, status]);

  const patch = (partial: Partial<Job>) =>
    setDraft((current) => (current ? { ...current, ...partial } : current));

  const submit = (statusOverride?: JobStatus) => {
    if (!draft) return;
    const id = draft.id || makeJobId(draft.title.en || draft.title.vi, jobs);
    const ok = saveJob({ ...draft, id, ...(statusOverride ? { status: statusOverride } : {}) });
    toast[ok ? "success" : "error"](ok ? t("admin.jobs.saved") : t("settings.storageNote"));
    setDraft(null);
    setIsNew(false);
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
              resetJobs();
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

      <div className="mt-5 hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.jobs.col.title")}</TableHead>
              <TableHead>{t("admin.jobs.col.department")}</TableHead>
              <TableHead>{t("admin.jobs.col.location")}</TableHead>
              <TableHead className="text-right">{t("admin.jobs.col.applicants")}</TableHead>
              <TableHead>{t("admin.jobs.col.deadline")}</TableHead>
              <TableHead>{t("admin.jobs.col.featured")}</TableHead>
              <TableHead>{t("admin.jobs.col.status")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{tr(job.title)}</TableCell>
                <TableCell className="text-muted-foreground">{tr(job.department)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {job.locations.map(tr).join(", ")}
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
                      deleteJob(job.id);
                      toast.success(t("admin.jobs.deleted"));
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                    deleteJob(job.id);
                    toast.success(t("admin.jobs.deleted"));
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? t("admin.jobs.new") : t("admin.jobs.edit")}</DialogTitle>
            <DialogDescription>{t("admin.jobs.storageNote")}</DialogDescription>
          </DialogHeader>

          {draft && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <section className="space-y-4">
                <p className="font-display text-sm font-semibold">{t("admin.jobs.group.basic")}</p>
                <BiField
                  label={t("admin.jobs.col.title")}
                  value={draft.title}
                  required
                  onChange={(title) => patch({ title })}
                />
                <TaxonomyField
                  label={t("admin.jobs.col.department")}
                  taxonomyKey="departments"
                  valueId={draft.departmentId}
                  onChange={(departmentId, department) => patch({ departmentId, department })}
                />
                <LocationsField
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
                <p className="font-display text-sm font-semibold">
                  {t("admin.jobs.group.details")}
                </p>
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
                  taxonomyKey="workTypes"
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
                  taxonomyKey="salaries"
                  valueId={draft.salaryId}
                  onChange={(salaryId, salary) => patch({ salaryId, salary })}
                />
                <TaxonomyField
                  label={t("admin.jobs.field.experience")}
                  taxonomyKey="experiences"
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
                <p className="font-display text-sm font-semibold">
                  {t("admin.jobs.group.content")}
                </p>
                <BiListField
                  label={t("admin.jobs.field.description")}
                  value={draft.description}
                  onChange={(description) => patch({ description })}
                />
                <BiListField
                  label={t("admin.jobs.field.requirements")}
                  value={draft.requirements}
                  onChange={(requirements) => patch({ requirements })}
                />
                <BiListField
                  label={t("admin.jobs.field.benefits")}
                  value={draft.benefits}
                  onChange={(benefits) => patch({ benefits })}
                />
              </section>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft(null);
                    setIsNew(false);
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => submit("draft")}>
                  {tr({ vi: "Lưu nháp", en: "Save as draft" })}
                </Button>
                <Button type="submit">{t("common.save")}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
