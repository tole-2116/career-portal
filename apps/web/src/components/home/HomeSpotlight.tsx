import { HeroCarousel } from "@/components/site/HeroCarousel";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import {
  HomeSearch,
  HomeSocials,
  homeCols,
  homeInnerClass,
  useHomeData,
} from "@/components/home/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/data/homeContent";
import type { AboutWidgetStyle, HomeWidgetKey } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/** Spotlight runs on a dark canvas, so tones are mapped to translucent overlays. */
function spotlightTone(tone: AboutWidgetStyle["tone"]): string {
  if (tone === "brand") return "bg-accent/10 border-y border-accent/25";
  if (tone === "soft") return "border-y border-primary-foreground/10 bg-primary-foreground/[0.04]";
  return "";
}

export function HomeSpotlight() {
  const { config, copy, featured, stats, sections, order, enabled, styleOf, tr } = useHomeData();
  const { culture, benefits, jobs: jobsSection, cta } = sections;

  const widgets: Record<HomeWidgetKey, (s: AboutWidgetStyle) => ReactNode> = {
    hero: (s) => (
      <section className="relative isolate overflow-hidden">
        <HeroCarousel
          images={config.images.heroImages}
          alt={tr(copy.title)}
          className="absolute inset-0 h-full w-full opacity-35"
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary/70 via-primary/90 to-primary" />
        <div
          className={cn(
            "relative mx-auto w-full max-w-6xl px-4 sm:px-6",
            homeInnerClass(s.spacing),
            s.layout === "center" && "text-center",
          )}
        >
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">
            {tr(copy.eyebrow)}
          </Badge>
          <h1
            className={cn(
              "mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.05] sm:text-6xl",
              s.layout === "center" && "mx-auto",
            )}
          >
            {tr(copy.title)}
          </h1>
          <p
            className={cn(
              "mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/70 sm:text-lg",
              s.layout === "center" && "mx-auto",
            )}
          >
            {tr(copy.subtitle)}
          </p>
          <HomeSearch
            tone="dark"
            className={cn("mt-9 max-w-2xl", s.layout === "center" && "mx-auto")}
          />
        </div>
      </section>
    ),

    stats: (s) => (
      <section className={spotlightTone(s.tone)}>
        <dl
          className={cn(
            "mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6",
            homeInnerClass(s.spacing),
            s.layout === "grid" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
          )}
        >
          {stats.map((stat) => (
            <div key={stat.id} className="min-w-0">
              <dd className="font-display text-3xl font-semibold text-accent">{stat.value}</dd>
              <dt className="mt-1 text-xs text-primary-foreground/60">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>
    ),

    jobs: (s) => (
      <section className={spotlightTone(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <h2 className="min-w-0 font-display text-3xl font-semibold sm:text-4xl">
              {tr(jobsSection.title)}
            </h2>
            <Link
              to="/jobs"
              className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary-foreground/70 hover:text-accent"
            >
              {tr(jobsSection.allLabel)} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className={cn("mt-8 grid gap-4", s.layout === "list" ? "" : "md:grid-cols-3")}>
            {featured.map((job) => (
              <Link
                key={job.id}
                to="/jobs/$jobId"
                params={{ jobId: job.id }}
                className="group block rounded-xl border border-primary-foreground/12 bg-primary-foreground/5 p-5 transition-colors hover:border-accent/60 hover:bg-primary-foreground/10"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-primary-foreground/50">
                      {tr(job.department)}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                      {tr(job.title)}
                    </h3>
                  </div>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-primary-foreground/50 group-hover:text-accent" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-primary-foreground/60">
                  {tr(job.summary)}
                </p>
                <p className="mt-4 text-xs text-primary-foreground/50">
                  {job.locations.map(tr).join(", ")} · {tr(job.salary)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),

    culture: (s) => (
      <section className={spotlightTone(s.tone)}>
        <div
          className={cn(
            "mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center",
            homeInnerClass(s.spacing),
          )}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {tr(culture.eyebrow)}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              {tr(culture.title)}
            </h2>
            {tr(culture.description) && (
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/60">
                {tr(culture.description)}
              </p>
            )}
            <div className={cn("mt-8 grid gap-6", homeCols(s.layout))}>
              {culture.items.map((value) => {
                const Icon = getIcon(value.icon);
                return (
                  <div key={value.id} className="min-w-0">
                    <Icon className="h-5 w-5 text-accent" />
                    <h3 className="mt-3 font-display text-base font-semibold">{tr(value.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-primary-foreground/60">
                      {tr(value.body)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <img
            src={config.images.culture}
            alt={tr(culture.title)}
            loading="lazy"
            width={1408}
            height={1008}
            className="h-72 w-full rounded-xl object-cover lg:h-96"
          />
        </div>
      </section>
    ),

    benefits: (s) => (
      <section className={spotlightTone(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            {tr(benefits.eyebrow)}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            {tr(benefits.title)}
          </h2>
          <div className={cn("mt-8 grid gap-4", homeCols(s.layout))}>
            {benefits.items.map((benefit) => {
              const Icon = getIcon(benefit.icon);
              return (
                <div
                  key={benefit.id}
                  className="rounded-xl border border-primary-foreground/12 bg-primary-foreground/5 p-6"
                >
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{tr(benefit.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/60">
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
      <section className={spotlightTone(s.tone)}>
        <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", homeInnerClass(s.spacing))}>
          <div
            className={cn(
              "grid gap-6 rounded-xl border border-accent/40 bg-accent/10 p-8",
              s.layout === "center"
                ? "justify-items-center text-center"
                : "sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
            )}
          >
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-semibold">{tr(cta.title)}</h2>
              <p className="mt-2 max-w-xl text-sm text-primary-foreground/70">{tr(cta.body)}</p>
              <HomeSocials className={cn("mt-5", s.layout === "center" && "justify-center")} />
            </div>
            <Button
              asChild
              size="lg"
              className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/apply">{tr(cta.buttonLabel)}</Link>
            </Button>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <div className="bg-primary text-primary-foreground">
      {order.map((key) =>
        enabled(key) ? <Fragment key={key}>{widgets[key](styleOf(key))}</Fragment> : null,
      )}
    </div>
  );
}
