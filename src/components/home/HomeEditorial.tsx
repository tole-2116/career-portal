import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import {
  HomeSearch,
  HomeSocials,
  homeCols,
  homeInnerClass,
  homeSectionClass,
  useHomeData,
} from "@/components/home/shared";
import { Button } from "@/components/ui/button";
import type { AboutWidgetStyle, HomeWidgetKey } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function HomeEditorial() {
  const { config, copy, featured, stats, sections, order, enabled, styleOf, tr } = useHomeData();
  const { culture, benefits, jobs: jobsSection, cta } = sections;

  const widgets: Record<HomeWidgetKey, (s: AboutWidgetStyle) => ReactNode> = {
    hero: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div
          className={cn(
            "mx-auto w-full max-w-4xl px-4 sm:px-6",
            homeInnerClass(s.spacing),
            s.layout === "center" && "text-center",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {tr(copy.eyebrow)}
          </p>
          <h1 className="mt-8 font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            {tr(copy.title)}
          </h1>
          <p
            className={cn(
              "mt-8 max-w-2xl text-lg leading-relaxed opacity-75",
              s.layout === "center" && "mx-auto",
            )}
          >
            {tr(copy.subtitle)}
          </p>
          <HomeSearch className={cn("mt-10 max-w-xl", s.layout === "center" && "mx-auto")} />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
          <HeroCarousel
            images={config.images.heroImages}
            alt={tr(copy.title)}
            className="h-72 w-full sm:h-[26rem]"
          />
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
              <dd className="font-display text-3xl font-semibold">{stat.value}</dd>
              <dt className="mt-1 text-xs opacity-70">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>
    ),

    culture: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] opacity-60">
              {tr(culture.eyebrow)}
            </h2>
            <div className="min-w-0">
              <p className="max-w-2xl font-display text-2xl leading-snug sm:text-3xl">
                {tr(culture.title)}
              </p>
              {tr(culture.description) && (
                <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-75">
                  {tr(culture.description)}
                </p>
              )}
              <div className={cn("mt-10 grid gap-x-12 gap-y-8", homeCols(s.layout))}>
                {culture.items.map((value) => (
                  <div key={value.id} className="min-w-0">
                    <h3 className="font-display text-base font-semibold">{tr(value.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed opacity-75">{tr(value.body)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    ),

    jobs: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] opacity-60">
              {tr(jobsSection.eyebrow)}
            </h2>
            <div className="min-w-0">
              <ul className="border-t border-border">
                {featured.map((job) => (
                  <li key={job.id}>
                    <Link
                      to="/jobs/$jobId"
                      params={{ jobId: job.id }}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-6 transition-colors hover:text-accent"
                    >
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide opacity-60">
                          {tr(job.department)} · {job.locations.map(tr).join(", ")}
                        </p>
                        <h3 className="mt-1 truncate font-display text-xl font-semibold">
                          {tr(job.title)}
                        </h3>
                      </div>
                      <ArrowUpRight className="h-5 w-5 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/jobs"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium hover:text-accent"
              >
                {tr(jobsSection.allLabel)} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    ),

    benefits: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] opacity-60">
              {tr(benefits.eyebrow)}
            </h2>
            <div className={cn("grid min-w-0 gap-x-12 gap-y-8", homeCols(s.layout))}>
              {benefits.items.map((benefit) => (
                <div key={benefit.id} className="min-w-0 border-t border-border pt-5">
                  <h3 className="font-display text-base font-semibold">{tr(benefit.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">{tr(benefit.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    ),

    cta: (s) => (
      <section className={homeSectionClass(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div
            className={cn(
              "grid gap-6",
              s.layout === "center"
                ? "justify-items-center text-center"
                : "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
            )}
          >
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-semibold">{tr(cta.title)}</h2>
              <p className="mt-2 max-w-xl text-sm opacity-75">{tr(cta.body)}</p>
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
