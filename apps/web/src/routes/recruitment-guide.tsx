import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig, type AboutWidgetStyle, type RecruitmentGuideKey } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { createRouteMeta } from "@/lib/route-meta";

export const Route = createFileRoute("/recruitment-guide")({
  head: createRouteMeta({ titleKey: "page.recruitmentGuide.title", descriptionKey: "page.recruitmentGuide.description" }),
  component: RecruitmentGuidePage,
});

function sectionClass(style: AboutWidgetStyle) {
  return cn(style.tone === "white" && "bg-background", style.tone === "soft" && "border-y border-border bg-surface", style.tone === "brand" && "bg-primary text-primary-foreground");
}

function innerClass(style: AboutWidgetStyle) {
  return cn("mx-auto w-full max-w-6xl px-4 sm:px-6", style.spacing === "compact" && "py-10 sm:py-12", style.spacing === "normal" && "py-16 sm:py-20", style.spacing === "spacious" && "py-20 sm:py-28");
}

function RecruitmentGuidePage() {
  const { tr } = useI18n();
  const { config } = useSiteConfig();
  const navigate = useNavigate();
  const enabled = config.modules.recruitmentGuide;
  useEffect(() => { if (!enabled) void navigate({ to: "/" }); }, [enabled, navigate]);
  if (!enabled) return null;

  const guide = config.recruitmentGuide;
  const fallback: AboutWidgetStyle = { layout: "default", tone: "white", spacing: "normal" };
  const renderSection = (key: RecruitmentGuideKey) => {
    const style = guide.styles[key] ?? fallback;
    const muted = style.tone === "brand" ? "text-primary-foreground/75" : "text-muted-foreground";
    if (key === "hero" && guide.hero.enabled) return <section key={key} className={sectionClass(style)}><div className={cn(innerClass(style), style.layout === "center" && "text-center")}><div className={cn("max-w-3xl", style.layout === "center" && "mx-auto")}><span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">{tr(guide.hero.eyebrow)}</span><h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">{tr(guide.hero.title)}</h1><p className={cn("mt-5 text-base leading-relaxed sm:text-lg", muted)}>{tr(guide.hero.subtitle)}</p></div></div></section>;
    if (key === "articles" && guide.articles.enabled && guide.articles.items.length) return <section key={key} className={sectionClass(style)}><div className={innerClass(style)}><h2 className="font-display text-2xl font-semibold sm:text-3xl">{tr(guide.articles.title)}</h2><div className={cn("mt-8 grid gap-5 sm:grid-cols-2", style.layout === "3" && "lg:grid-cols-3", style.layout !== "3" && "lg:grid-cols-2")}>{guide.articles.items.map((item, index) => <article key={item.id} className="rounded-xl border border-border bg-card p-6 text-card-foreground"><span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span><h3 className="mt-5 font-display text-lg font-semibold">{tr(item.title)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(item.body)}</p></article>)}</div></div></section>;
    return null;
  };

  return <SiteLayout>{guide.order.map(renderSection)}</SiteLayout>;
}
