import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Localized } from "@/lib/i18n";

export type TaxonomyKey =
  | "departments"
  | "workTypes"
  | "salaries"
  | "experiences"
  | "locations";

export type TaxonomyItem = { id: string; label: Localized };

export type Taxonomies = Record<TaxonomyKey, TaxonomyItem[]>;

export const taxonomyKeys: TaxonomyKey[] = [
  "departments",
  "workTypes",
  "salaries",
  "experiences",
  "locations",
];

function normalizeList(value: unknown): TaxonomyItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw): TaxonomyItem | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as { id?: unknown; label?: { vi?: unknown; en?: unknown } };
      if (typeof r.id !== "string" || !r.id) return null;
      return {
        id: r.id,
        label: {
          vi: typeof r.label?.vi === "string" ? r.label.vi : "",
          en: typeof r.label?.en === "string" ? r.label.en : "",
        },
      };
    })
    .filter((v): v is TaxonomyItem => v !== null);
}

export function makeTaxonomyId(label: string, existing: TaxonomyItem[]): string {
  const base =
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "muc";
  let id = base;
  let i = 2;
  while (existing.some((entry) => entry.id === id)) {
    id = `${base}-${i}`;
    i += 1;
  }
  return id;
}

/** A catalogue group created by an admin, sitting beside the five built-ins. */
export type CustomGroup = { key: string; label: Localized; items: TaxonomyItem[] };

type TaxonomyValue = {
  ready: boolean;
  taxonomies: Taxonomies;
  customGroups: CustomGroup[];
};

const TaxonomyContext = createContext<TaxonomyValue | null>(null);

type State = { taxonomies: Taxonomies; customGroups: CustomGroup[] };

export function TaxonomyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>(() => ({
    taxonomies: {
      departments: [],
      workTypes: [],
      salaries: [],
      experiences: [],
      locations: [],
    },
    customGroups: [],
  }));

  // Tải danh mục từ API công khai; không có fallback — danh sách rỗng nếu API không khả dụng.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/taxonomies");
        const body = (await response.json()) as {
          success: boolean;
          data?: {
            taxonomies?: Partial<Record<"department" | "workType" | "salary" | "experience" | "location", { id: string; label: Localized }[]>>;
            customGroups?: { key: string; label: Localized; items: { id: string; label: Localized }[] }[];
          };
          error?: string;
        };
        if (cancelled || !response.ok || body?.success === false || !body.data) return;
        setState({
          taxonomies: {
            departments: normalizeList(body.data.taxonomies?.department),
            workTypes: normalizeList(body.data.taxonomies?.workType),
            salaries: normalizeList(body.data.taxonomies?.salary),
            experiences: normalizeList(body.data.taxonomies?.experience),
            locations: normalizeList(body.data.taxonomies?.location),
          },
          customGroups: (body.data.customGroups ?? []).map((group) => ({
            key: group.key,
            label: group.label,
            items: normalizeList(group.items),
          })),
        });
      } catch {
        /* API không khả dụng — giữ danh sách rỗng */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<TaxonomyValue>(
    () => ({
      ready,
      taxonomies: state.taxonomies,
      customGroups: state.customGroups,
    }),
    [ready, state],
  );

  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
}

export function useTaxonomies(): TaxonomyValue {
  const ctx = useContext(TaxonomyContext);
  if (!ctx) throw new Error("useTaxonomies must be used inside TaxonomyProvider");
  return ctx;
}

/** Merge catalogue entries with values already used by postings. */
export function mergeOptions(catalogue: TaxonomyItem[], used: Localized[]): Localized[] {
  const map = new Map<string, Localized>();
  for (const entry of catalogue) {
    if (entry.label.vi || entry.label.en) map.set(entry.label.en || entry.label.vi, entry.label);
  }
  for (const value of used) {
    const key = value.en || value.vi;
    if (key && !map.has(key)) map.set(key, value);
  }
  return Array.from(map.values());
}
