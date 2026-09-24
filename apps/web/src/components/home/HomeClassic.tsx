import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import {
  HomeSearch,
  HomeSocials,
  homeCols,
  homeInnerClass,
  homeSectionClass,
  useHomeData,
} from "@/components/home/shared";
import { JobCard } from "@/components/site/JobCard";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/data/homeContent";
import type { AboutWidgetStyle, HomeWidgetKey } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function HomeClassic() {
  const { config, copy, featured, stats, sections, order, enabled, styleOf, tr } = useHomeData();
  const { culture, benefits, jobs: jobsSection, cta } = sections;

  const widgets: Record<HomeWidgetKey, (s: AboutWidgetStyle) => ReactNode> = {
    hero: (s) => (
      <section className="relative isolate overflow-hidden hero-gradient text-primary-foreground">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
        <div
          className={cn(
            "relative mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6",
            homeInnerClass(s.spacing),
            s.layout === "center" ? "text-center" : "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center",
          )}
        >
          <div className={cn("min-w-0", s.layout === "center" && "mx-auto max-w-3xl")}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {tr(copy.eyebrow)}
            </span>
            <h1
              className={cn(
                "mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-balance-tight sm:text-5xl lg:text-6xl",
                s.layout === "center" && "mx-auto",
              )}
            >
              {tr(copy.title)}
            </h1>
            <p
              className={cn(
                "mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/75",
                s.layout === "center" && "mx-auto",
              )}
            >
              {tr(copy.subtitle)}
            </p>
            <div className={cn("mt-9 max-w-xl", s.layout === "center" && "mx-auto")}>
              <HomeSearch tone="dark" />
            </div>
          </div>

          <div className="relative min-w-0">
            <HeroCarousel
              images={config.images.heroImages}
              alt={tr(copy.title)}
              className="h-72 w-full rounded-2xl shadow-deep sm:h-[26rem]"
            />
          </div>
        </div>
      </section>
    ),

    stats: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <dl
          className={cn(
            "mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6",
            homeInnerClass(s.spacing),
            s.layout === "grid" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
          )}
        >
          {stats.map((stat) => (
            <div key={stat.id} className="min-w-0 text-center">
              <dd className="font-display text-3xl font-semibold sm:text-4xl">{stat.value}</dd>
              <dt className="mt-1.5 text-xs opacity-70">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>
    ),

    culture: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <p className="eyebrow text-accent">{tr(culture.eyebrow)}</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold text-balance-tight sm:text-4xl">
            {tr(culture.title)}
          </h2>
          {tr(culture.description) && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-75">
              {tr(culture.description)}
            </p>
          )}
          <div className={cn("mt-10 grid gap-4", homeCols(s.layout))}>
            {culture.items.map((value) => {
              const Icon = getIcon(value.icon);
              return (
                <div
                  key={value.id}
                  className="group flex min-w-0 gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold">{tr(value.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {tr(value.body)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    ),

    benefits: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
            <img
              src={config.images.culture}
              alt={tr(benefits.title)}
              loading="lazy"
              width={1408}
              height={1008}
              className="h-72 w-full rounded-xl object-cover lg:h-96"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {tr(benefits.eyebrow)}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                {tr(benefits.title)}
              </h2>
              {tr(benefits.description) && (
                <p className="mt-3 text-sm leading-relaxed opacity-75">
                  {tr(benefits.description)}
                </p>
              )}
              <div className="mt-8 space-y-6">
                {benefits.items.map((benefit) => {
                  const Icon = getIcon(benefit.icon);
                  return (
                    <div key={benefit.id} className="flex gap-4">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold">
                          {tr(benefit.title)}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed opacity-75">
                          {tr(benefit.body)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    ),

    jobs: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {tr(jobsSection.eyebrow)}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
                {tr(jobsSection.title)}
              </h2>
            </div>
            <Link
              to="/jobs"
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium hover:text-accent"
            >
              {tr(jobsSection.allLabel)} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className={cn("mt-8 grid gap-4", s.layout === "list" ? "" : "md:grid-cols-3")}>
            {featured.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>
    ),

    cta: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div
          className={cn(
            "mx-auto flex w-full max-w-6xl gap-6 px-4 sm:px-6",
            homeInnerClass(s.spacing),
            s.layout === "center"
              ? "flex-col items-center text-center"
              : "flex-col sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{tr(cta.title)}</h2>
            <p className="mt-2 max-w-xl text-sm opacity-75">{tr(cta.body)}</p>
            <HomeSocials className={cn("mt-5", s.layout === "center" && "justify-center")} />
          </div>
          <Button asChild variant="secondary" size="lg" className="shrink-0">
            <Link to="/apply">{tr(cta.buttonLabel)}</Link>
          </Button>
        </div>
      </section>
    ),
  };

  return (
    <>
      {order.map((key) =>
        enabled(key) ? <Fragment key={key}>{widgets[key](styleOf(key))}</Fragment> : null,
      )}
    </>
  );
}
