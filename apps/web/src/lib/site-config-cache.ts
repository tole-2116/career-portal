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

const LANG_STORAGE_KEY = "talenthub-lang";
const FALLBACK_BRAND = "TalentHub";

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