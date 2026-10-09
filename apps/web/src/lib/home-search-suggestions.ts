import type { Job } from "@/data/jobs";
import type { Localized } from "@/lib/i18n";
import type { Taxonomies } from "@/lib/taxonomy-store";

export type HomeSearchSuggestionKind = "title" | "keyword" | "department" | "location";

export type HomeSearchSuggestion = {
  id: string;
  kind: HomeSearchSuggestionKind;
  label: Localized;
  value: string;
};

/** Normalize text for case-insensitive deduplication. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

/** Extract technology/skill keywords from job requirement text. */
function extractKeywords(text: string | null | undefined): string[] {
  if (!text || typeof text !== "string") return [];

  // Split on newlines, bullets, commas, semicolons
  const fragments = text
    .split(/[\n•·\-,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const keywords: string[] = [];
  const stopWords = new Set([
    "and",
    "or",
    "the",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "from",
    "by",
    "as",
    "is",
    "was",
    "are",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "may",
    "might",
    "must",
    "can",
    "về",
    "của",
    "và",
    "có",
    "được",
    "trong",
    "các",
    "này",
    "cho",
    "với",
  ]);

  for (const fragment of fragments) {
    // Ignore too short (< 2 chars) or too long (> 50 chars, likely a sentence)
    if (fragment.length < 2 || fragment.length > 50) continue;

    // Ignore if it looks like a sentence (contains multiple spaces and common sentence patterns)
    if (fragment.includes("  ") || /\b(the|is|are|was|were|will|can|should)\s+\w+\s+\w+/.test(fragment.toLowerCase())) continue;

    // Clean punctuation at start/end
    const cleaned = fragment.replace(/^[^\w\s]+|[^\w\s]+$/g, "").trim();
    if (cleaned.length < 2) continue;

    // Check if it's a stop word
    const lower = cleaned.toLowerCase();
    if (stopWords.has(lower)) continue;

    // Keep meaningful phrases (tech keywords, skills, tools)
    if (/[a-zA-Z]/.test(cleaned) || /[À-ɏḀ-ỿ]/.test(cleaned)) {
      keywords.push(cleaned);
    }
  }

  return keywords;
}

/** Build job title suggestions from open jobs. */
function buildTitleSuggestions(jobs: Job[]): HomeSearchSuggestion[] {
  const seen = new Map<string, Localized>();

  for (const job of jobs) {
    if (!job.title || !job.title.vi || !job.title.en) continue;
    const key = normalize(`${job.title.en}-${job.title.vi}`);
    if (!seen.has(key)) {
      seen.set(key, job.title);
    }
  }

  return Array.from(seen.entries()).slice(0, 6).map(([, label], idx) => ({
    id: `title-${idx}`,
    kind: "title" as const,
    label,
    value: label.en || label.vi,
  }));
}

/** Build keyword suggestions from job requirements and descriptions. */
function buildKeywordSuggestions(jobs: Job[]): HomeSearchSuggestion[] {
  const keywordFreq = new Map<string, { count: number; original: string }>();

  for (const job of jobs) {
    // Extract from requirements first, then summary, then description
    const sources = [
      job.requirements?.vi || "",
      job.requirements?.en || "",
      job.summary?.vi || "",
      job.summary?.en || "",
      job.description?.vi || "",
      job.description?.en || "",
    ];

    for (const source of sources) {
      const keywords = extractKeywords(source);
      for (const kw of keywords) {
        const norm = normalize(kw);
        const existing = keywordFreq.get(norm);
        if (existing) {
          existing.count += 1;
        } else {
          keywordFreq.set(norm, { count: 1, original: kw });
        }
      }
    }
  }

  // Sort by frequency, take top 8
  const sorted = Array.from(keywordFreq.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  return sorted.map(([, { original }], idx) => ({
    id: `keyword-${idx}`,
    kind: "keyword" as const,
    label: { vi: original, en: original },
    value: original,
  }));
}

/** Build department suggestions from jobs and taxonomies. */
function buildDepartmentSuggestions(
  jobs: Job[],
  taxonomies: Taxonomies,
): HomeSearchSuggestion[] {
  const seen = new Map<string, { id: string; label: Localized }>();

  for (const job of jobs) {
    // Prefer departmentId if available
    if (job.departmentId) {
      const taxonomy = taxonomies.departments.find((d) => d.id === job.departmentId);
      if (taxonomy && !seen.has(taxonomy.id)) {
        seen.set(taxonomy.id, { id: taxonomy.id, label: taxonomy.label });
      }
    } else if (job.department) {
      // Try to match job.department label to taxonomy
      const match = taxonomies.departments.find(
        (d) =>
          normalize(d.label.vi) === normalize(job.department.vi) ||
          normalize(d.label.en) === normalize(job.department.en),
      );
      if (match && !seen.has(match.id)) {
        seen.set(match.id, { id: match.id, label: match.label });
      }
    }
  }

  return Array.from(seen.values()).slice(0, 4).map((item, idx) => ({
    id: `department-${idx}`,
    kind: "department" as const,
    label: item.label,
    value: item.id,
  }));
}

/** Build location suggestions from jobs and taxonomies. */
function buildLocationSuggestions(
  jobs: Job[],
  taxonomies: Taxonomies,
): HomeSearchSuggestion[] {
  const seen = new Map<string, { id: string; label: Localized }>();

  for (const job of jobs) {
    // Use locationIds if available
    if (job.locationIds && job.locationIds.length > 0) {
      for (const locId of job.locationIds) {
        const taxonomy = taxonomies.locations.find((l) => l.id === locId);
        if (taxonomy && !seen.has(taxonomy.id)) {
          seen.set(taxonomy.id, { id: taxonomy.id, label: taxonomy.label });
        }
      }
    } else if (job.locations && job.locations.length > 0) {
      // Try to match location labels
      for (const loc of job.locations) {
        const match = taxonomies.locations.find(
          (l) =>
            normalize(l.label.vi) === normalize(loc.vi) ||
            normalize(l.label.en) === normalize(loc.en),
        );
        if (match && !seen.has(match.id)) {
          seen.set(match.id, { id: match.id, label: match.label });
        }
      }
    }
  }

  return Array.from(seen.values()).slice(0, 4).map((item, idx) => ({
    id: `location-${idx}`,
    kind: "location" as const,
    label: item.label,
    value: item.id,
  }));
}

/** Build all homepage search suggestions from jobs and taxonomies. */
export function buildHomeSearchSuggestions(
  jobs: Job[],
  taxonomies: Taxonomies,
): HomeSearchSuggestion[] {
  if (!jobs || jobs.length === 0) return [];

  const titles = buildTitleSuggestions(jobs);
  const keywords = buildKeywordSuggestions(jobs);
  const departments = buildDepartmentSuggestions(jobs, taxonomies);
  const locations = buildLocationSuggestions(jobs, taxonomies);

  // Combine and limit to ~20-24 total
  return [...titles, ...keywords, ...departments, ...locations].slice(0, 24);
}
