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

export function HomeSplit() {
  const { config, copy, featured, stats, sections, order, enabled, styleOf, tr } = useHomeData();
  const { culture, benefits, jobs: jobsSection, cta } = sections;

  const widgets: Record<HomeWidgetKey, (s: AboutWidgetStyle) => ReactNode> = {
    hero: (s) => (
      <section className="border-b border-border">
        <div className={cn("grid", s.layout === "center" ? "" : "lg:grid-cols-2")}>
          <div
            className={cn(
              "flex min-w-0 flex-col justify-center px-4 sm:px-10 lg:px-14",
              homeInnerClass(s.spacing),
              s.layout === "center" && "mx-auto max-w-3xl items-center text-center",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {tr(copy.eyebrow)}
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
              {tr(copy.title)}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {tr(copy.subtitle)}
            </p>
            <HomeSearch className="mt-8 w-full max-w-xl" />
          </div>
          <div className="relative min-h-64 bg-surface lg:min-h-full">
            <HeroCarousel
              images={config.images.heroImages}
              alt={tr(copy.title)}
              className="h-64 max-h-[38rem] w-full lg:h-full lg:max-h-none"
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
            <div key={stat.id} className="min-w-0">
              <dd className="font-display text-2xl font-semibold">{stat.value}</dd>
              <dt className="mt-1 text-xs opacity-70">{stat.label}</dt>
            </div>
          ))}
        </dl>
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

    culture: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div
          className={cn(
            "mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]",
            homeInnerClass(s.spacing),
          )}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {tr(culture.eyebrow)}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              {tr(culture.title)}
            </h2>
            {tr(culture.description) && (
              <p className="mt-3 text-sm leading-relaxed opacity-75">{tr(culture.description)}</p>
            )}
            <img
              src={config.images.culture}
              alt={tr(culture.title)}
              loading="lazy"
              width={1408}
              height={1008}
              className="mt-8 h-56 w-full rounded-xl object-cover"
            />
          </div>
          <div className={cn("grid gap-6", homeCols(s.layout))}>
            {culture.items.map((value) => {
              const Icon = getIcon(value.icon);
              return (
                <div
                  key={value.id}
                  className="min-w-0 rounded-lg border border-border bg-card p-5 text-card-foreground"
                >
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-4 font-display text-base font-semibold">{tr(value.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tr(value.body)}
                  </p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {tr(benefits.eyebrow)}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            {tr(benefits.title)}
          </h2>
          {tr(benefits.description) && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-75">
              {tr(benefits.description)}
            </p>
          )}
          <div className={cn("mt-8 grid gap-4", homeCols(s.layout))}>
            {benefits.items.map((benefit) => {
              const Icon = getIcon(benefit.icon);
              return (
                <div
                  key={benefit.id}
                  className="rounded-lg border border-border bg-card p-6 text-card-foreground"
                >
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{tr(benefit.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tr(benefit.body)}
                  </p>
                </div>
              );
            })}
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
