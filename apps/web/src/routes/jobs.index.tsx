import { createFileRoute } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { JobCard } from "@/components/site/JobCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n, type Localized } from "@/lib/i18n";
import { useJobs } from "@/lib/jobs-store";
import { useTaxonomies, type TaxonomyItem } from "@/lib/taxonomy-store";
import { useSiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type JobSearch = { q?: string | undefined };

export const Route = createFileRoute("/jobs/")({
  validateSearch: (search: Record<string, unknown>): JobSearch => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Vị trí đang tuyển — TalentHub | Open positions" },
      {
        name: "description",
        content:
          "Danh sách vị trí đang tuyển tại TalentHub. Lọc theo ngành nghề, nơi làm việc, hình thức và kinh nghiệm.",
      },
      { property: "og:title", content: "Vị trí đang tuyển — TalentHub" },
      {
        property: "og:description",
        content: "Lọc theo ngành nghề, nơi làm việc, hình thức và kinh nghiệm để tìm vị trí phù hợp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobsPage,
});

const ALL = "__all__";

type SortKey = "relevant" | "newest" | "salaryDesc" | "salaryAsc";

/** First number found in a salary label, used for ordering only. */
function salaryValue(salary: Localized): number {
  const text = `${salary.vi} ${salary.en}`.replace(/[.,]/g, "");
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function FacetSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const { t } = useI18n();
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value === ALL ? "" : value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="bg-card">
          <SelectValue placeholder={t("jobs.filter.all")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("jobs.filter.all")}</SelectItem>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function JobsPage() {
  const { q } = Route.useSearch();
  const { t, tr } = useI18n();
  const { jobs } = useJobs();
  const { taxonomies } = useTaxonomies();
  const { config } = useSiteConfig();
  const page = config.jobsPage;

  /** Paused and closed postings never appear on the public site. */
  const publicJobs = useMemo(() => jobs.filter((job) => job.status === "open"), [jobs]);

  const [keyword, setKeyword] = useState(q ?? "");
  const [department, setDepartment] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [workType, setWorkType] = useState(ALL);
  const [salary, setSalary] = useState(ALL);
  const [experience, setExperience] = useState(ALL);
  const [sort, setSort] = useState<SortKey>("relevant");
  const [visible, setVisible] = useState(page.pageSize);

  const results = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    const filtered = publicJobs
      .filter((job) =>
        needle
          ? `${job.title.vi} ${job.title.en} ${job.department.vi} ${job.department.en} ${job.summary.vi} ${job.summary.en}`
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .filter((job) => (department === ALL ? true : job.departmentId === department))
      .filter((job) => (location === ALL ? true : job.locationIds?.includes(location)))
      .filter((job) => (workType === ALL ? true : job.workTypeId === workType))
      .filter((job) => (salary === ALL ? true : job.salaryId === salary))
      .filter((job) => (experience === ALL ? true : job.experienceId === experience));

    if (sort === "newest") return [...filtered].sort((a, b) => (a.posted < b.posted ? 1 : -1));
    if (sort === "salaryDesc")
      return [...filtered].sort((a, b) => salaryValue(b.salary) - salaryValue(a.salary));
    if (sort === "salaryAsc")
      return [...filtered].sort((a, b) => salaryValue(a.salary) - salaryValue(b.salary));
    return [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured));
  }, [publicJobs, keyword, department, location, workType, salary, experience, sort]);

  useEffect(() => {
    setVisible(page.pageSize);
  }, [page.pageSize, keyword, department, location, workType, salary, experience, sort]);

  const shown = results.slice(0, visible);
  const opt = (items: TaxonomyItem[]) =>
    items.map((item) => ({ value: item.id, label: tr(item.label) }));

  const filterBlock = (
    <div
      className={cn(
        "grid gap-4",
        page.filterLayout === "bar" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1",
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("jobs.filter.keyword")}</Label>
        <div className="flex min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("home.search.keyword")}
            className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {page.filters.department && (
        <FacetSelect
          label={t("jobs.filter.department")}
          value={department}
          onChange={setDepartment}
          options={opt(taxonomies.departments)}
        />
      )}
      {page.filters.location && (
        <FacetSelect
          label={t("jobs.filter.location")}
          value={location}
          onChange={setLocation}
          options={opt(taxonomies.locations)}
        />
      )}
      {page.filters.workType && (
        <FacetSelect
          label={t("jobs.filter.type")}
          value={workType}
          onChange={setWorkType}
          options={opt(taxonomies.workTypes)}
        />
      )}
      {page.filters.salary && taxonomies.salaries.length > 0 && (
        <FacetSelect
          label={t("jobs.filter.salary")}
          value={salary}
          onChange={setSalary}
          options={opt(taxonomies.salaries)}
        />
      )}
      {page.filters.experience && taxonomies.experiences.length > 0 && (
        <FacetSelect
          label={t("jobs.filter.experience")}
          value={experience}
          onChange={setExperience}
          options={opt(taxonomies.experiences)}
        />
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-1 w-full justify-center"
        onClick={() => {
          setKeyword("");
          setDepartment(ALL);
          setLocation(ALL);
          setWorkType(ALL);
          setSalary(ALL);
          setExperience(ALL);
        }}
      >
        {t("jobs.filter.reset")}
      </Button>
    </div>
  );

  const listBlock = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("jobs.found")} <span className="font-semibold text-foreground">{results.length}</span>{" "}
          {t("jobs.count")}
        </p>
        <div className="flex min-w-0 items-center gap-2">
          <Label className="shrink-0 text-xs text-muted-foreground">{t("jobs.sort.label")}</Label>
          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger aria-label={t("jobs.sort.label")} className="w-48 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant">{t("jobs.sort.relevant")}</SelectItem>
              <SelectItem value="newest">{t("jobs.sort.newest")}</SelectItem>
              <SelectItem value="salaryDesc">{t("jobs.sort.salaryDesc")}</SelectItem>
              <SelectItem value="salaryAsc">{t("jobs.sort.salaryAsc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("jobs.empty")}
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {shown.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {visible < results.length && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + page.pageSize)}>
                {t("jobs.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{tr(page.title)}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {tr(page.subtitle)}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        {page.filterLayout === "sidebar" ? (
          <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
              <p className="flex items-center gap-2 font-display text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-accent" /> {t("jobs.filter.title")}
              </p>
              <div className="mt-4">{filterBlock}</div>
            </aside>
            {listBlock}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">{filterBlock}</div>
            {listBlock}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
