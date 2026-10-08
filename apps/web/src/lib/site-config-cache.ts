import type { Localized } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/site-config";

/**
 * Module-level cache for the site config, read by route metadata (`head` runs
 * outside React so it cannot use hooks). Kept in its own dependency-neutral
 * module so both `route-meta.ts` and `site-config.tsx` can depend on it without
 * creating a runtime import cycle.
 */
let cachedSiteConfig: SiteConfig | null = null;

export function setCachedSiteConfig(config: SiteConfig): void {
  cachedSiteConfig = config;
}

export function getCachedSiteConfig(): SiteConfig | null {
  return cachedSiteConfig;
}

const CONFIG_STORAGE_KEY = "career-portal-site-config";

/** Read a previously saved config without touching storage during SSR. */
export function readStoredSiteConfig(): SiteConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Partial<SiteConfig>;
    return value.images && value.copy ? (parsed as SiteConfig) : null;
  } catch {
    return null;
  }
}

/** Return the best available config for synchronous client initialization. */
export function getInitialSiteConfig(): SiteConfig | null {
  return getCachedSiteConfig() ?? readStoredSiteConfig();
}

const LANG_STORAGE_KEY = "talenthub-lang";
const FALLBACK_BRAND = "TalentHub";
const FALLBACK_FAVICON = "/favicon.png";

export type FaviconLink = { rel: "icon"; type?: string; href: string };

/** Resolve a favicon link descriptor from a configured logo URL/data URL. */
export function faviconFromLogo(logo?: string | null): FaviconLink {
  const value = logo?.trim();
  if (!value) {
    return { rel: "icon", type: "image/png", href: FALLBACK_FAVICON };
  }

  const dataType = value.match(/^data:([^;,]+)/i)?.[1]?.toLowerCase();
  if (value.startsWith("data:")) {
    return dataType && dataType.startsWith("image/")
      ? { rel: "icon", type: dataType, href: value }
      : { rel: "icon", type: "image/png", href: FALLBACK_FAVICON };
  }

  const clean = (value.split(/[?#]/)[0] ?? value).toLowerCase();
  const extension = clean.match(/\.([a-z0-9]+)$/)?.[1];
  const types: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
  };

  return extension && types[extension]
    ? { rel: "icon", type: types[extension], href: value }
    : { rel: "icon", href: value };
}

/** Use the cached site config to resolve the configured favicon/logo. */
export function getFaviconLink(): FaviconLink {
  return faviconFromLogo(getCachedSiteConfig()?.images?.logo);
}

/** Resolve the localized brand for the active language from a cached config. */
export function brandFromConfig(config: SiteConfig | null): string {
  if (!config) return FALLBACK_BRAND;
  const brand: Localized | undefined = config.copy?.brand;
  if (!brand) return FALLBACK_BRAND;

  // Read active language the same way `translate()` does.
  let lang = "vi";
  if (typeof window !== "undefined") {
    try {
      lang = window.localStorage.getItem(LANG_STORAGE_KEY) || "vi";
    } catch {
      /* ignore blocked storage */
    }
  }

  return brand[lang] || brand.vi || brand.en || FALLBACK_BRAND;
}