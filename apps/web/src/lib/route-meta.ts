import type { TranslationKey } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import {
  brandFromConfig,
  getCachedSiteConfig,
  getFaviconLink,
} from "@/lib/site-config-cache";

export { setCachedSiteConfig } from "@/lib/site-config-cache";

/**
 * Get the current brand name, respecting active language.
 * Falls back to default brand if API config unavailable.
 */
export function getSiteBrand(): string {
  return brandFromConfig(getCachedSiteConfig());
}

type RouteMetaOptions = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  ogDescriptionKey?: TranslationKey;
  noIndex?: boolean;
  ogType?: string;
  twitterCard?: string;
};

type MetaDescriptor =
  | { charSet: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { title: string };

/**
 * Factory for static route head metadata with i18n titles and dynamic brand suffix.
 *
 * Usage:
 * ```ts
 * export const Route = createFileRoute("/about")({
 *   head: createRouteMeta({
 *     titleKey: "page.about.title",
 *     descriptionKey: "page.about.description",
 *   }),
 *   component: AboutPage,
 * });
 * ```
 */
export function createRouteMeta(options: RouteMetaOptions) {
  const {
    titleKey,
    descriptionKey,
    ogDescriptionKey,
    noIndex = false,
    ogType = "website",
    twitterCard = "summary_large_image",
  } = options;

  return () => {
    const pageTitle = translate(titleKey);
    const brand = getSiteBrand();
    const fullTitle = `${pageTitle} — ${brand}`;

    const description = translate(descriptionKey);
    const ogDescription = ogDescriptionKey ? translate(ogDescriptionKey) : description;

    const meta: MetaDescriptor[] = [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:type", content: ogType },
      { name: "twitter:card", content: twitterCard },
    ];

    if (noIndex) {
      meta.push({ name: "robots", content: "noindex" });
    }

    return { meta, links: [getFaviconLink()] };
  };
}

type DynamicRouteMetaOptions<TData> = {
  title: (data: TData | undefined) => string;
  description: (data: TData | undefined) => string;
  ogDescription?: (data: TData | undefined) => string;
  noIndex?: boolean | ((data: TData | undefined) => boolean);
  ogType?: string;
  twitterCard?: string;
};

/**
 * Factory for dynamic route head metadata (routes with loaderData).
 *
 * Usage:
 * ```ts
 * export const Route = createFileRoute("/jobs/$jobId/")({
 *   loader: async ({ params }) => ({ job: await fetchJob(params.jobId) }),
 *   head: createDynamicRouteMeta({
 *     title: (data) => data.job ? translate("page.job.title", data.job.title.vi) : "Not found",
 *     description: (data) => data.job?.summary.vi || "",
 *     noIndex: (data) => !data.job,
 *   }),
 *   component: JobPage,
 * });
 * ```
 */
export function createDynamicRouteMeta<TData>(options: DynamicRouteMetaOptions<TData>) {
  const {
    title: titleFn,
    description: descriptionFn,
    ogDescription: ogDescriptionFn,
    noIndex = false,
    ogType = "website",
    twitterCard = "summary_large_image",
  } = options;

  return ({ loaderData }: { loaderData?: TData | undefined }) => {
    const pageTitle = titleFn(loaderData);
    const brand = getSiteBrand();
    const fullTitle = `${pageTitle} — ${brand}`;

    const description = descriptionFn(loaderData);
    const ogDescription = ogDescriptionFn ? ogDescriptionFn(loaderData) : description;
    const shouldNoIndex = typeof noIndex === "function" ? noIndex(loaderData) : noIndex;

    const meta: MetaDescriptor[] = [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:type", content: ogType },
      { name: "twitter:card", content: twitterCard },
    ];

    if (shouldNoIndex) {
      meta.push({ name: "robots", content: "noindex" });
    }

    return { meta, links: [getFaviconLink()] };
  };
}

/** Update the current document title and OG title after a brand change. */
export function refreshDocumentBrand(): void {
  if (typeof document === "undefined") return;

  const brand = getSiteBrand();
  const currentTitle = document.title;
  const separator = " — ";
  const pageTitle = currentTitle.includes(separator)
    ? currentTitle.slice(0, currentTitle.lastIndexOf(separator))
    : currentTitle;
  const fullTitle = pageTitle ? `${pageTitle}${separator}${brand}` : brand;

  document.title = fullTitle;
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", fullTitle);

  const favicon = getFaviconLink();
  const iconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'));
  const iconLink = iconLinks[0] ?? document.createElement("link");
  iconLink.rel = favicon.rel;
  iconLink.href = favicon.href;
  if (favicon.type) iconLink.type = favicon.type;
  else iconLink.removeAttribute("type");
  if (!iconLink.parentNode) document.head.appendChild(iconLink);
  iconLinks.slice(1).forEach((link) => link.remove());
}
