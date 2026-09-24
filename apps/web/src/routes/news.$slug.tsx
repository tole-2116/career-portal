import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import DOMPurify from "dompurify";
import { toHtml, useNews } from "@/lib/news-store";
import { useSiteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/news/$slug")({
  head: () => ({
    meta: [
      { title: "Bài viết — TalentHub | Article" },
      {
        name: "description",
        content: "Bài viết tin tức, hoạt động và văn hóa doanh nghiệp tại TalentHub.",
      },
      { property: "og:title", content: "Bài viết — TalentHub" },
      {
        property: "og:description",
        content: "Bài viết tin tức, hoạt động và văn hóa doanh nghiệp tại TalentHub.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { tr } = useI18n();
  const { config } = useSiteConfig();
  const { articles, categories } = useNews();
  const navigate = useNavigate();
  const enabled = config.modules.news;

  const article = articles.find((item) => item.slug === slug && item.published);
  const rawBody = article ? toHtml(tr(article.body)) : "";
  const [safeHtml, setSafeHtml] = useState("");

  useEffect(() => {
    if (!enabled) void navigate({ to: "/" });
  }, [enabled, navigate]);

  useEffect(() => {
    setSafeHtml(DOMPurify.sanitize(rawBody));
  }, [rawBody]);

  if (!enabled) return null;


  if (!article) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            {tr({ vi: "Không tìm thấy bài viết.", en: "Article not found." })}
          </p>
          <Button asChild className="mt-6">
            <Link to="/news">{tr({ vi: "Về trang tin tức", en: "Back to news" })}</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const category = categories.find((item) => item.id === article.categoryId);
  const related = articles
    .filter(
      (item) =>
        item.published && item.id !== article.id && item.categoryId === article.categoryId,
    )
    .slice(0, 3);

  return (
    <SiteLayout>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {tr({ vi: "Tin tức", en: "News" })}
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {category && <Badge variant="secondary">{tr(category.label)}</Badge>}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> {article.date}
          </span>
          <span className="text-xs text-muted-foreground">· {article.author}</span>
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          {tr(article.title)}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">{tr(article.excerpt)}</p>

        <img
          src={article.cover}
          alt={tr(article.title)}
          width={1200}
          height={720}
          decoding="async"
          fetchPriority="high"
          className="mt-8 h-72 w-full rounded-xl object-cover sm:h-96"
        />

        <div
          className="rich-text mt-8 text-base leading-relaxed"
          // Sanitised on the client before injection.
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-xl font-semibold">
              {tr({ vi: "Bài viết liên quan", en: "Related articles" })}
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to="/news/$slug"
                  params={{ slug: item.slug }}
                  className="group min-w-0 overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/50"
                >
                  <img
                    src={item.cover}
                    alt={tr(item.title)}
                    loading="lazy"
                    width={600}
                    height={360}
                    className="h-36 w-full object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-display text-base font-semibold leading-snug group-hover:text-accent">
                      {tr(item.title)}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
