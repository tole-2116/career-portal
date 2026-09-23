import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/data/homeContent";
import { useI18n } from "@/lib/i18n";
import { useSiteConfig, type AboutWidgetKey, type AboutWidgetStyle } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Về chúng tôi — TalentHub | About us" },
      { name: "description", content: "Câu chuyện, cột mốc, giá trị và đội ngũ dẫn dắt tại TalentHub." },
      { property: "og:title", content: "Về chúng tôi — TalentHub | About us" },
      { property: "og:description", content: "Câu chuyện, cột mốc, giá trị và môi trường làm việc tại TalentHub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.charAt(0) ?? ""}${parts.length > 1 ? parts.at(-1)?.charAt(0) ?? "" : ""}`.toUpperCase();
}

function sectionClass(style: AboutWidgetStyle) {
  return cn(
    style.tone === "white" && "bg-background",
    style.tone === "soft" && "border-y border-border bg-surface",
    style.tone === "brand" && "bg-primary text-primary-foreground",
  );
}

function innerClass(style: AboutWidgetStyle) {
  return cn(
    "mx-auto w-full max-w-6xl px-4 sm:px-6",
    style.spacing === "compact" && "py-10 sm:py-12",
    style.spacing === "normal" && "py-16 sm:py-20",
    style.spacing === "spacious" && "py-20 sm:py-28",
  );
}

function AboutPage() {
  const { t, tr } = useI18n();
  const { config } = useSiteConfig();
  const { about, company } = config;
  const order: AboutWidgetKey[] = about?.order?.length
    ? about.order
    : ["hero", "story", "timeline", "values", "leaders", "gallery", "contact"];
  const fallbackStyle: AboutWidgetStyle = { layout: "default", tone: "white", spacing: "normal" };

  const renderWidget = (key: AboutWidgetKey) => {
    const style = about?.styles?.[key] ?? fallbackStyle;
    const muted = style.tone === "brand" ? "text-primary-foreground/75" : "text-muted-foreground";

    if (key === "hero" && about.hero.enabled) return (
      <section key={key} className={cn("relative isolate overflow-hidden", sectionClass(style))}>
        {about.hero.image && <img src={about.hero.image} alt={tr(about.hero.title)} width={1600} height={900} decoding="async" fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-35" />}
        {style.tone === "brand" && <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary via-primary/85 to-primary/40" aria-hidden />}
        <div className={cn(innerClass(style), style.layout === "center" && "text-center")}>
          <div className={cn("max-w-3xl", style.layout === "center" && "mx-auto")}>
            {tr(about.hero.eyebrow).trim() && <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">{tr(about.hero.eyebrow)}</span>}
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-6xl">{tr(about.hero.title)}</h1>
            {tr(about.hero.subtitle).trim() && <p className={cn("mt-5 text-base leading-relaxed sm:text-lg", muted)}>{tr(about.hero.subtitle)}</p>}
          </div>
          {(about.hero.stats ?? []).length > 0 && <dl className={cn("mt-12 grid gap-px overflow-hidden rounded-xl border", style.tone === "brand" ? "border-primary-foreground/20 bg-primary-foreground/20" : "border-border bg-border", style.layout === "center" ? "sm:grid-flow-col sm:auto-cols-fr" : "sm:grid-cols-2 lg:grid-cols-4")}>
            {(about.hero.stats ?? []).map((stat) => <div key={stat.id} className={cn("px-5 py-6", style.tone === "brand" ? "bg-primary/80" : "bg-card")}><dt className="font-display text-3xl font-bold text-accent">{stat.value}</dt><dd className={cn("mt-1 text-sm", muted)}>{tr(stat.label)}</dd></div>)}
          </dl>}
        </div>
      </section>
    );

    if (key === "story" && about.story.enabled) return (
      <section key={key} className={sectionClass(style)}><div className={innerClass(style)}><div className={cn("grid items-center gap-10", style.layout !== "full" && "lg:grid-cols-2")}>
        <div className={cn(style.layout === "image-left" && "lg:order-2")}><h2 className="font-display text-2xl font-semibold sm:text-3xl">{tr(about.story.title)}</h2><div className="mt-6 space-y-4">{(about.story.paragraphs ?? []).map((p, i) => <p key={`${i}-${p.en}`} className={cn("text-sm leading-relaxed sm:text-base", muted)}>{tr(p)}</p>)}</div></div>
        {about.story.image && <img src={about.story.image} alt={tr(about.story.title)} loading="lazy" className={cn("aspect-[4/3] w-full rounded-xl border border-border object-cover shadow-sm", style.layout === "image-left" && "lg:order-1", style.layout === "full" && "max-h-[32rem]")} />}
      </div></div></section>
    );

    if (key === "timeline" && about.timeline.enabled && about.timeline.items.length) return (
      <section key={key} className={sectionClass(style)}><div className={innerClass(style)}><h2 className="font-display text-2xl font-semibold sm:text-3xl">{tr(about.timeline.title)}</h2><ol className={cn("mt-10 grid gap-6", style.layout === "vertical" ? "max-w-3xl" : "sm:grid-cols-2 lg:grid-cols-4")}>
        {(about.timeline.items ?? []).map((item) => <li key={item.id} className={cn("relative pt-5", style.layout === "vertical" ? "border-l-2 border-accent pl-6" : "border-t-2 border-accent")}><span className="font-display text-2xl font-bold text-accent">{item.year}</span><h3 className="mt-2 font-display text-base font-semibold">{tr(item.title)}</h3><p className={cn("mt-2 text-sm leading-relaxed", muted)}>{tr(item.body)}</p></li>)}
      </ol></div></section>
    );

    if (key === "values" && about.values.enabled && about.values.items.length) return (
      <section key={key} className={sectionClass(style)}><div className={innerClass(style)}><h2 className="font-display text-2xl font-semibold sm:text-3xl">{tr(about.values.title)}</h2>{tr(about.values.description).trim() && <p className={cn("mt-3 max-w-2xl text-sm sm:text-base", muted)}>{tr(about.values.description)}</p>}<div className={cn("mt-10 grid gap-5 sm:grid-cols-2", style.layout === "3" ? "lg:grid-cols-3" : style.layout === "4" ? "lg:grid-cols-4" : "lg:grid-cols-2")}>
        {(about.values.items ?? []).map((item) => { const Icon = getIcon(item.icon); return <div key={item.id} className="rounded-xl border border-border bg-card p-6 text-card-foreground transition-shadow hover:shadow-md"><span className="grid h-11 w-11 place-items-center rounded-lg bg-accent/15 text-accent"><Icon className="h-5 w-5" /></span><h3 className="mt-4 font-display text-base font-semibold">{tr(item.title)}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(item.body)}</p></div>; })}
      </div></div></section>
    );

    if (key === "leaders" && about.leaders.enabled && about.leaders.items.length) return (
      <section key={key} className={sectionClass(style)}><div className={innerClass(style)}><h2 className="font-display text-2xl font-semibold sm:text-3xl">{tr(about.leaders.title)}</h2><div className={cn("mt-10 grid gap-5 sm:grid-cols-2", style.layout === "3" ? "lg:grid-cols-3" : style.layout === "4" ? "lg:grid-cols-4" : "lg:grid-cols-2")}>
        {(about.leaders.items ?? []).map((leader) => <div key={leader.id} className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground">{leader.photo ? <img src={leader.photo} alt={leader.name} loading="lazy" className="aspect-[4/5] w-full object-cover" /> : <div className="grid aspect-[4/5] w-full place-items-center bg-primary/10"><span className="font-display text-3xl font-bold text-primary">{initials(leader.name)}</span></div>}<div className="p-5"><p className="font-display text-base font-semibold">{leader.name}</p><p className="mt-1 text-sm text-muted-foreground">{tr(leader.role)}</p></div></div>)}
      </div></div></section>
    );

    if (key === "gallery" && about.gallery.enabled && about.gallery.items.length) return (
      <section key={key} className={sectionClass(style)}><div className={innerClass(style)}><h2 className="font-display text-2xl font-semibold sm:text-3xl">{tr(about.gallery.title)}</h2><div className={cn("mt-8 gap-4", style.layout === "strip" ? "flex snap-x overflow-x-auto pb-3" : "grid sm:grid-cols-2 lg:grid-cols-3")}>
        {(about.gallery.items ?? []).map((photo, index) => <figure key={photo.id} className={cn("group relative overflow-hidden rounded-xl border border-border", style.layout === "featured" && index === 0 && "lg:col-span-2 lg:row-span-2", style.layout === "strip" && "w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[32%]")}><img src={photo.url} alt={tr(photo.caption)} loading="lazy" className={cn("w-full object-cover transition-transform duration-500 group-hover:scale-105", style.layout === "featured" && index === 0 ? "h-64 lg:h-full lg:min-h-[22rem]" : "h-56")} />{tr(photo.caption).trim() && <figcaption className="absolute inset-x-0 bottom-0 bg-foreground/80 px-4 py-3 text-sm text-background">{tr(photo.caption)}</figcaption>}</figure>)}
      </div><Button asChild className="mt-10"><Link to="/jobs">{t("home.jobs.all")}</Link></Button></div></section>
    );

    if (key === "contact" && about.contact.enabled) return (
      <section key={key} className={sectionClass(style)}><div className={innerClass(style)}><h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("footer.contact")}</h2>{tr(company.intro).trim() && <p className={cn("mt-4 max-w-2xl text-sm leading-relaxed", muted)}>{tr(company.intro)}</p>}<div className={cn("mt-8 grid gap-4", style.layout === "row" ? "md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {(company.locations ?? []).map((loc) => <div key={loc.id} className="rounded-xl border border-border bg-card p-5 text-card-foreground"><p className="flex items-center gap-2 font-display text-sm font-semibold"><MapPin className="h-4 w-4 text-accent" />{tr(loc.name)}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tr(loc.address)}</p></div>)}
        {(company.email.trim() || company.phone.trim()) && <div className="rounded-xl border border-border bg-card p-5 text-card-foreground"><p className="font-display text-sm font-semibold">{t("footer.contact")}</p><div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">{company.email.trim() && <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-accent"><Mail className="h-4 w-4 text-accent" /><span className="truncate">{company.email}</span></a>}{company.phone.trim() && <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-accent"><Phone className="h-4 w-4 text-accent" />{company.phone}</a>}</div></div>}
      </div><Button asChild className="mt-8"><Link to="/contact">{t("nav.contact")}</Link></Button></div></section>
    );
    return null;
  };

  return <SiteLayout>{order.map(renderWidget)}</SiteLayout>;
}