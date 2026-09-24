import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useNews } from "@/lib/news-store";
import { useSiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "Tin tức — TalentHub | Company news" },
      {
        name: "description",
        content:
          "Tin tức, hoạt động công ty, văn hóa và sự kiện mới nhất của TalentHub dành cho ứng viên và đối tác.",
      },
      { property: "og:title", content: "Tin tức — TalentHub" },
      {
        property: "og:description",
        content: "Hoạt động công ty, văn hóa và sự kiện mới nhất của TalentHub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsListPage,
});

const PAGE_SIZE = 6;

function NewsListPage() {
  const { tr } = useI18n();
  const { config } = useSiteConfig();
  const { articles, categories } = useNews();
  const navigate = useNavigate();
  const enabled = config.modules.news;

  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!enabled) void navigate({ to: "/" });
  }, [enabled, navigate]);

  const published = useMemo(
    () =>
      articles
        .filter((item) => item.published)
        .filter((item) => (category === "all" ? true : item.categoryId === category))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [articles, category],
  );

  if (!enabled) return null;

  const shown = published.slice(0, visible);

  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {tr({ vi: "Tin tức", en: "News" })}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {tr({
              vi: "Hoạt động công ty, văn hóa và sự kiện mới nhất.",
              en: "Company activities, culture and the latest events.",
            })}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: { vi: "Tất cả", en: "All" } }, ...categories].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setCategory(item.id);
                setVisible(PAGE_SIZE);
              }}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                category === item.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {tr(item.label)}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {tr({ vi: "Chưa có bài viết nào.", en: "No articles yet." })}
          </p>
        ) : (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shown.map((article) => {
                const cat = categories.find((item) => item.id === article.categoryId);
                return (
                  <Link
                    key={article.id}
                    to="/news/$slug"
                    params={{ slug: article.slug }}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/50"
                  >
                    <img
                      src={article.cover}
                      alt={tr(article.title)}
                      loading="lazy"
                      width={800}
                      height={480}
                      className="h-44 w-full object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {cat && <Badge variant="secondary">{tr(cat.label)}</Badge>}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" /> {article.date}
                        </span>
                      </div>
                      <h2 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-accent">
                        {tr(article.title)}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {tr(article.excerpt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {visible < published.length && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  {tr({ vi: "Xem thêm", en: "Load more" })}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </SiteLayout>
  );
}
