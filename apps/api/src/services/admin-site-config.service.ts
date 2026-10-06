import { db } from "@career-portal/database";
import { defaultSiteConfig } from "../defaults/site-config.defaults";

export type { SiteConfigPayload } from "../defaults/site-config.defaults";
import type { SiteConfigPayload } from "../defaults/site-config.defaults";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mergeSiteConfig(partial: Partial<SiteConfigPayload>): SiteConfigPayload {
  const base = structuredClone(defaultSiteConfig);
  return {
    layout: typeof partial.layout === "string" ? partial.layout : base.layout,
    paletteId: typeof partial.paletteId === "string" ? partial.paletteId : base.paletteId,
    primary: typeof partial.primary === "string" ? partial.primary : base.primary,
    accent: typeof partial.accent === "string" ? partial.accent : base.accent,
    surfaceTone: typeof partial.surfaceTone === "string" ? partial.surfaceTone : base.surfaceTone,
    images: { ...base.images, ...asRecord(partial.images) },
    copy: { ...base.copy, ...asRecord(partial.copy) },
    sections: { ...base.sections, ...asRecord(partial.sections) },
    company: { ...base.company, ...asRecord(partial.company) },
    about: { ...base.about, ...asRecord(partial.about) },
    jobsPage: { ...base.jobsPage, ...asRecord(partial.jobsPage) },
    modules: {
      news: typeof partial.modules?.news === "boolean" ? partial.modules.news : base.modules.news,
      openApplication:
        typeof partial.modules?.openApplication === "boolean"
          ? partial.modules.openApplication
          : base.modules.openApplication,
    },
  };
}

function readConfig(row: {
  layout: string;
  paletteId: string;
  primary: string;
  accent: string;
  surfaceTone: string;
  images: unknown;
  copy: unknown;
  sections: unknown;
  company: unknown;
  about: unknown;
  jobsPage: unknown;
  modules: unknown;
}): SiteConfigPayload {
  return mergeSiteConfig({
    layout: row.layout,
    paletteId: row.paletteId,
    primary: row.primary,
    accent: row.accent,
    surfaceTone: row.surfaceTone,
    images: asRecord(row.images),
    copy: asRecord(row.copy),
    sections: asRecord(row.sections),
    company: asRecord(row.company),
    about: asRecord(row.about),
    jobsPage: asRecord(row.jobsPage),
    modules: asRecord(row.modules) as SiteConfigPayload["modules"],
  });
}

export class AdminSiteConfigService {
  async get(): Promise<SiteConfigPayload> {
    const row = await db.site_configs.findFirst({ where: { isdelete: false } });
    if (!row) throw new Error("Site configuration not found");
    return readConfig(row);
  }

  async save(payload: Partial<SiteConfigPayload>, actor = "admin"): Promise<SiteConfigPayload> {
    const existing = await db.site_configs.findFirst({ where: { isdelete: false } });
    const config = mergeSiteConfig(payload);
    const data = {
      layout: config.layout,
      paletteId: config.paletteId,
      primary: config.primary,
      accent: config.accent,
      surfaceTone: config.surfaceTone,
      images: config.images,
      copy: config.copy,
      sections: config.sections,
      company: config.company,
      about: config.about,
      jobsPage: config.jobsPage,
      modules: config.modules,
      code: existing?.code ?? "site-config",
      userupdated_at: actor,
    };
    if (existing) {
      return readConfig(await db.site_configs.update({ where: { id: existing.id }, data }));
    }
    return readConfig(await db.site_configs.create({ data: { ...data, usercreate_at: actor } }));
  }

  async reset(actor = "admin"): Promise<SiteConfigPayload> {
    return this.save(defaultSiteConfig, actor);
  }
}

export const adminSiteConfigService = new AdminSiteConfigService();
