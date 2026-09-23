import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  Check,
  Globe,
  Mail,
  MapPin,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getJob } from "@/data/jobs";
import { useI18n, type Localized } from "@/lib/i18n";
import { useJobs } from "@/lib/jobs-store";
import { useSiteConfig } from "@/lib/site-config";
import { useTaxonomies } from "@/lib/taxonomy-store";

export const Route = createFileRoute("/jobs/$jobId/")({
  loader: ({ params }) => ({ job: getJob(params.jobId) ?? null }),
  head: ({ loaderData }) => {
    const job = loaderData?.job;
    if (!job) {
      return {
        meta: [
          { title: "Không tìm thấy vị trí — TalentHub" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${job.title.vi} — TalentHub | ${job.title.en}`;
    return {
      meta: [
        { title },
        { name: "description", content: job.summary.vi },
        { property: "og:title", content: title },
        { property: "og:description", content: job.summary.vi },
      ],
    };
  },
  component: JobDetailPage,
});

function JobDetailPage() {
  const { job: staticJob } = Route.useLoaderData();
  const { jobId } = Route.useParams();
  const { jobs } = useJobs();
  const { taxonomies } = useTaxonomies();
  const { config } = useSiteConfig();
  const { t, tr } = useI18n();
  const job = jobs.find((item) => item.id === jobId) ?? staticJob;

  if (!job) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">{t("jobs.notfound")}</p>
          <Button asChild className="mt-6">
            <Link to="/jobs">{t("jobs.back")}</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const taxonomyLabel = (
    key: "departments" | "workTypes" | "salaries" | "experiences",
    id: string | undefined,
    fallback: Localized,
  ) => taxonomies[key].find((item) => item.id === id)?.label ?? fallback;
  const department = taxonomyLabel("departments", job.departmentId, job.department);
  const workType = taxonomyLabel("workTypes", job.workTypeId, job.workType);
  const salary = taxonomyLabel("salaries", job.salaryId, job.salary);
  const experience = taxonomyLabel("experiences", job.experienceId, job.experience ?? { vi: "", en: "" });
  const locations = (job.locationIds ?? [])
    .map((id) => taxonomies.locations.find((item) => item.id === id)?.label)
    .filter((label): label is typeof job.department => Boolean(label));
  const displayLocations = locations.length ? locations : job.locations;

  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("jobs.back")}
          </Link>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {tr(department)}
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{tr(job.title)}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {tr(job.summary)}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {job.featured && (
              <Badge className="gap-1">
                <Sparkles className="h-3 w-3" /> {t("jobs.featured")}
              </Badge>
            )}
            <Badge variant="secondary">{tr(workType)}</Badge>
            <Badge variant="outline">{tr(job.level)}</Badge>
            {job.status === "paused" && (
              <Badge variant="outline">{tr({ vi: "Tạm dừng nhận hồ sơ", en: "Paused" })}</Badge>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0 space-y-10">
          <section>
            <h2 className="font-display text-xl font-semibold">{t("jobs.section.about")}</h2>
            <div className="mt-4 space-y-4">
              {job.description.map((paragraph) => (
                <p key={paragraph.en} className="text-sm leading-relaxed text-muted-foreground">
                  {tr(paragraph)}
                </p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">{t("jobs.section.requirements")}</h2>
            <ul className="mt-4 space-y-3">
              {job.requirements.map((item) => (
                <li key={item.en} className="flex gap-3 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{tr(item)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">{t("jobs.section.benefits")}</h2>
            <ul className="mt-4 space-y-3">
              {job.benefits.map((item) => (
                <li key={item.en} className="flex gap-3 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{tr(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-lg border border-border bg-card p-5">
            <dl className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{t("jobs.filter.location")}</dt>
                  <dd className="font-medium">{displayLocations.map(tr).join(", ") || "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{t("jobs.salary")}</dt>
                  <dd className="font-medium">{tr(salary)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{t("jobs.deadline")}</dt>
                  <dd className="font-medium">{job.deadline}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">
                    {t("admin.jobs.col.applicants")}
                  </dt>
                  <dd className="font-medium">{job.applicants}</dd>
                </div>
              </div>
              {typeof job.headcount === "number" && job.headcount > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{t("jobs.headcount")}</dt>
                    <dd className="font-medium">{job.headcount}</dd>
                  </div>
                </div>
              )}
              {job.experience && (job.experience.vi || job.experience.en) && (
                <div className="flex items-start gap-3">
                  <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{t("jobs.experience")}</dt>
                    <dd className="font-medium">{tr(experience)}</dd>
                  </div>
                </div>
              )}
              {job.languages && (job.languages.vi || job.languages.en) && (
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{t("jobs.languages")}</dt>
                    <dd className="font-medium">{tr(job.languages)}</dd>
                  </div>
                </div>
              )}
              {(job.contactEmail || job.contactName) && (
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{t("jobs.contact")}</dt>
                    <dd className="break-words font-medium">
                      {job.contactName}
                      {job.contactName && job.contactEmail ? " · " : ""}
                      {job.contactEmail}
                    </dd>
                  </div>
                </div>
              )}
            </dl>

            {job.status === "open" ? (
              <Button asChild className="mt-6 w-full" size="lg">
                <Link to="/jobs/$jobId/apply" params={{ jobId: job.id }}>
                  {t("nav.apply")}
                </Link>
              </Button>
            ) : (
              <div className="mt-6 space-y-3">
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  {tr({
                    vi: "Vị trí này không còn nhận hồ sơ.",
                    en: "This position is no longer accepting applications.",
                  })}
                </p>
                {config.modules.openApplication && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/apply">
                      {tr({ vi: "Gửi hồ sơ tự do", en: "Submit an open application" })}
                    </Link>
                  </Button>
                )}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {t("jobs.posted")}: {job.posted}
            </p>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}
