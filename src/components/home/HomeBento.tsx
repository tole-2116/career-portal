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

export function HomeBento() {
  const { config, copy, featured, stats, sections, order, enabled, styleOf, tr } = useHomeData();
  const { culture, benefits, jobs: jobsSection, cta } = sections;

  const widgets: Record<HomeWidgetKey, (s: AboutWidgetStyle) => ReactNode> = {
    hero: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className={cn("grid gap-4", s.layout === "center" ? "" : "md:grid-cols-3")}>
            <div
              className={cn(
                "min-w-0 rounded-2xl border border-border bg-card p-7 text-card-foreground",
                s.layout === "center" ? "text-center" : "md:col-span-2",
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {tr(copy.eyebrow)}
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-[1.06] sm:text-5xl">
                {tr(copy.title)}
              </h1>
              <p
                className={cn(
                  "mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base",
                  s.layout === "center" && "mx-auto",
                )}
              >
                {tr(copy.subtitle)}
              </p>
              <HomeSearch className={cn("mt-7", s.layout === "center" && "mx-auto max-w-xl")} />
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-border">
              <HeroCarousel
                images={config.images.heroImages}
                alt={tr(copy.title)}
                className="h-52 w-full md:h-full md:min-h-64"
              />
            </div>
          </div>
        </div>
      </section>
    ),

    stats: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="rounded-2xl border border-border bg-primary p-7 text-primary-foreground">
            <dl
              className={cn(
                "grid gap-5",
                s.layout === "grid" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
              )}
            >
              {stats.map((stat) => (
                <div key={stat.id} className="min-w-0">
                  <dd className="font-display text-2xl font-semibold">{stat.value}</dd>
                  <dt className="mt-1 text-xs text-primary-foreground/75">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    ),

    culture: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{tr(culture.title)}</h2>
          {tr(culture.description) && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-75">
              {tr(culture.description)}
            </p>
          )}
          <div className={cn("mt-6 grid gap-4", homeCols(s.layout))}>
            {culture.items.map((value) => {
              const Icon = getIcon(value.icon);
              return (
                <div
                  key={value.id}
                  className="min-w-0 rounded-2xl border border-border bg-card p-6 text-card-foreground"
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
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">{tr(benefits.title)}</h2>
          <div className={cn("mt-6 grid gap-4", homeCols(s.layout))}>
            {benefits.items.map((benefit) => {
              const Icon = getIcon(benefit.icon);
              return (
                <div
                  key={benefit.id}
                  className="min-w-0 rounded-2xl border border-border bg-card p-6 text-card-foreground"
                >
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-4 font-display text-base font-semibold">{tr(benefit.title)}</h3>
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

    jobs: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <h2 className="min-w-0 font-display text-3xl font-semibold sm:text-4xl">
              {tr(jobsSection.title)}
            </h2>
            <Link
              to="/jobs"
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium hover:text-accent"
            >
              {tr(jobsSection.allLabel)} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className={cn("mt-6 grid gap-4", s.layout === "list" ? "" : "md:grid-cols-3")}>
            {featured.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>
    ),

    cta: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div
            className={cn(
              "grid gap-4 rounded-2xl border border-border bg-surface p-7 text-foreground",
              s.layout === "center"
                ? "justify-items-center text-center"
                : "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
            )}
          >
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-semibold">{tr(cta.title)}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{tr(cta.body)}</p>
              <HomeSocials className={cn("mt-5", s.layout === "center" && "justify-center")} />
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link to="/apply">{tr(cta.buttonLabel)}</Link>
            </Button>
          </div>
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
