import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Banknote, Clock, MapPin, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Job } from "@/data/jobs";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig } from "@/lib/site-config";
import { useTaxonomies } from "@/lib/taxonomy-store";

export function JobCard({ job }: { job: Job }) {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const { taxonomies } = useTaxonomies();
  const card = config.jobsPage.card;
  const byId = (key: "departments" | "workTypes" | "salaries", id?: string) =>
    taxonomies[key].find((item) => item.id === id)?.label;
  const department = byId("departments", job.departmentId) ?? job.department;
  const workType = byId("workTypes", job.workTypeId) ?? job.workType;
  const salary = byId("salaries", job.salaryId) ?? job.salary;
  const taxonomyLocations = (job.locationIds ?? [])
    .map((id) => taxonomies.locations.find((item) => item.id === id)?.label)
    .filter((label): label is typeof job.department => Boolean(label));
  const locs = (taxonomyLocations.length ? taxonomyLocations : job.locations)
    .map(tr)
    .filter((value) => value.trim().length > 0);
  const locationLabel =
    locs.length > 2 ? `${locs.slice(0, 2).join(", ")} +${locs.length - 2}` : locs.join(", ");

  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lift"
    >
      <span className="absolute inset-x-0 top-0 h-0.5 scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="max-w-full truncate">
              {tr(department)}
            </Badge>
            {card.featuredBadge && job.featured && (
              <Badge className="gap-1">
                <Sparkles className="h-3 w-3" /> {t("jobs.featured")}
              </Badge>
            )}
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{tr(job.title)}</h3>
        </div>
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {tr(job.summary)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-accent" /> {locationLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-accent" /> {tr(workType)}
        </span>
        {card.deadline && job.deadline && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-accent" /> {t("jobs.deadline")}: {job.deadline}
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        {card.salary && (salary.vi || salary.en) ? (
          <span className="flex items-center gap-1.5 font-medium">
            <Banknote className="h-4 w-4 text-accent" /> {tr(salary)}
          </span>
        ) : (
          <Badge variant="outline">{tr(job.level)}</Badge>
        )}
        <span className="font-medium text-accent group-hover:underline">{t("jobs.detail")}</span>
      </div>
    </Link>
  );
}
