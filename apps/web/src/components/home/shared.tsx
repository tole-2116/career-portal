import { useNavigate } from "@tanstack/react-router";
import { Facebook, Github, Linkedin, MessageCircle, Music2, Search, Youtube } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { isPublicJob, useJobs } from "@/lib/jobs-store";
import {
  homeWidgetKeys,
  useSiteConfig,
  type AboutWidgetSpacing,
  type AboutWidgetStyle,
  type AboutWidgetTone,
  type HomeWidgetKey,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

const fallbackStyle: AboutWidgetStyle = { layout: "default", tone: "white", spacing: "normal" };

/** Background classes for a widget tone. */
export function homeSectionClass(tone: AboutWidgetTone): string {
  if (tone === "brand") return "bg-primary text-primary-foreground";
  if (tone === "soft") return "border-y border-border bg-surface";
  return "bg-background";
}

/** Vertical padding classes for a widget spacing. */
export function homeInnerClass(spacing: AboutWidgetSpacing): string {
  if (spacing === "compact") return "py-10 sm:py-12";
  if (spacing === "spacious") return "py-20 sm:py-28";
  return "py-16 sm:py-20";
}

/** Grid column classes for a numeric layout value ("2" | "3" | "4"). */
export function homeCols(layout: string): string {
  if (layout === "2") return "sm:grid-cols-2";
  if (layout === "4") return "sm:grid-cols-2 lg:grid-cols-4";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

export function useHomeData() {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const sections = config.sections;
  const { jobs } = useJobs();

  const liveJobs = jobs.filter(isPublicJob);
  const openCount = liveJobs.length;
  const count = Math.min(Math.max(sections.jobs.count || 3, 1), 6);
  const featuredList = liveJobs.filter((job) => job.featured);
  const featured = (featuredList.length ? featuredList : liveJobs).slice(0, count);

  const stats = (sections.stats.items ?? []).map((stat) => ({
    id: stat.id,
    value: stat.auto ? String(openCount) : stat.value,
    label: tr(stat.label),
  }));

  const storedOrder = sections.order?.length ? sections.order : [...homeWidgetKeys];
  const order = storedOrder.filter((key) => homeWidgetKeys.includes(key));

  const enabled = (key: HomeWidgetKey) => {
    if (key === "hero") return sections.hero?.enabled !== false;
    if (key === "cta") return sections.cta.enabled && config.modules.openApplication;
    if (key === "stats") return sections.stats.enabled && stats.length > 0;
    return sections[key].enabled;
  };

  const styleOf = (key: HomeWidgetKey): AboutWidgetStyle => sections.styles?.[key] ?? fallbackStyle;

  return {
    config,
    sections,
    featured,
    openCount,
    stats,
    copy: config.copy,
    order,
    enabled,
    styleOf,
    tr,
    t,
  };
}

export function HomeSearch({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/jobs", search: keyword ? { q: keyword } : {} });
      }}
      className={cn(
        "flex w-full flex-col gap-2 rounded-2xl border p-2 sm:flex-row sm:items-center",
        tone === "dark"
          ? "border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-md"
          : "border-border bg-card shadow-lift",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <Search
          className={cn(
            "h-4 w-4 shrink-0",
            tone === "dark" ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t("home.search.keyword")}
          aria-label={t("home.search.keyword")}
          className={cn(
            "border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
            tone === "dark" && "text-primary-foreground placeholder:text-primary-foreground/60",
          )}
        />
      </div>
      <Button type="submit" variant="accent" size="lg" className="shrink-0">
        {tr(config.copy.ctaLabel)}
      </Button>
    </form>
  );
}

/** Social icons for the home page; hidden when no link is configured. */
export function HomeSocials({ className }: { className?: string }) {
  const { t } = useI18n();
  const { config } = useSiteConfig();
  const social = config.company.social;

  const items = [
    { href: social.facebook, Icon: Facebook, label: "Facebook" },
    { href: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { href: social.youtube, Icon: Youtube, label: "YouTube" },
    { href: social.github, Icon: Github, label: "GitHub" },
    { href: social.zalo ?? "", Icon: MessageCircle, label: "Zalo" },
    { href: social.tiktok ?? "", Icon: Music2, label: "TikTok" },
  ].filter((item) => item.href.trim().length > 0);

  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="mr-1 text-xs uppercase tracking-wide opacity-70">
        {t("home.social.title")}
      </span>
      {items.map(({ href, Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={label}
          className="grid h-9 w-9 place-items-center rounded-full border border-current/20 opacity-80 transition-opacity hover:opacity-100"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
