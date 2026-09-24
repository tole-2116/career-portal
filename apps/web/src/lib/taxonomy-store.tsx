import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Localized } from "@/lib/i18n";

const STORAGE_KEY = "talenthub-taxonomies";

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

function item(id: string, vi: string, en: string): TaxonomyItem {
  return { id, label: { vi, en } };
}

export const defaultTaxonomies: Taxonomies = {
  departments: [
    item("engineering", "Công nghệ", "Engineering"),
    item("design", "Thiết kế", "Design"),
    item("people", "Nhân sự", "People"),
    item("sales", "Kinh doanh", "Sales"),
    item("marketing", "Marketing", "Marketing"),
    item("operations", "Vận hành", "Operations"),
  ],
  workTypes: [
    item("full-time", "Toàn thời gian", "Full-time"),
    item("part-time", "Bán thời gian", "Part-time"),
    item("hybrid", "Kết hợp từ xa", "Hybrid"),
    item("remote", "Làm việc từ xa", "Remote"),
    item("internship", "Thực tập", "Internship"),
    item("contract", "Hợp đồng thời vụ", "Contract"),
  ],
  salaries: [
    item("negotiable", "Thỏa thuận", "Negotiable"),
    item("s-10-15", "10 – 15 triệu VNĐ", "10 – 15M VND"),
    item("s-15-25", "15 – 25 triệu VNĐ", "15 – 25M VND"),
    item("s-25-40", "25 – 40 triệu VNĐ", "25 – 40M VND"),
    item("s-40-60", "40 – 60 triệu VNĐ", "40 – 60M VND"),
    item("s-60-plus", "Trên 60 triệu VNĐ", "Above 60M VND"),
  ],
  experiences: [
    item("none", "Chưa yêu cầu kinh nghiệm", "No experience required"),
    item("under-1", "Dưới 1 năm", "Less than 1 year"),
    item("1-3", "1 – 3 năm", "1 – 3 years"),
    item("3-5", "3 – 5 năm", "3 – 5 years"),
    item("over-5", "Trên 5 năm", "More than 5 years"),
  ],
  locations: [
    item("hanoi", "Hà Nội", "Hanoi"),
    item("hcmc", "TP. Hồ Chí Minh", "Ho Chi Minh City"),
    item("danang", "Đà Nẵng", "Da Nang"),
    item("remote-vn", "Toàn quốc / Từ xa", "Nationwide / Remote"),
  ],
};

function normalizeList(value: unknown, fallback: TaxonomyItem[]): TaxonomyItem[] {
  if (!Array.isArray(value)) return structuredClone(fallback);
  const next = value
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
  return next.length ? next : structuredClone(fallback);
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

function normalizeGroups(value: unknown): CustomGroup[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw): CustomGroup | null => {
      if (!raw || typeof raw !== "object") return null;
      const g = raw as { key?: unknown; label?: { vi?: unknown; en?: unknown }; items?: unknown };
      if (typeof g.key !== "string" || !g.key) return null;
      return {
        key: g.key,
        label: {
          vi: typeof g.label?.vi === "string" ? g.label.vi : "",
          en: typeof g.label?.en === "string" ? g.label.en : "",
        },
        items: normalizeList(g.items, []).filter((item) => item.label.vi || item.label.en),
      };
    })
    .filter((g): g is CustomGroup => g !== null);
}

type TaxonomyValue = {
  ready: boolean;
  taxonomies: Taxonomies;
  customGroups: CustomGroup[];
  addItem: (key: string, label?: Localized) => void;
  updateItem: (key: string, id: string, label: Localized) => void;
  moveItem: (key: string, id: string, direction: -1 | 1) => void;
  removeItem: (key: string, id: string) => void;
  addGroup: (label: Localized) => void;
  removeGroup: (key: string) => void;
  resetTaxonomies: () => void;
};

const TaxonomyContext = createContext<TaxonomyValue | null>(null);

type State = { taxonomies: Taxonomies; customGroups: CustomGroup[] };

function isBuiltIn(key: string): key is TaxonomyKey {
  return (taxonomyKeys as string[]).includes(key);
}

function listOf(state: State, key: string): TaxonomyItem[] {
  return isBuiltIn(key)
    ? state.taxonomies[key]
    : (state.customGroups.find((group) => group.key === key)?.items ?? []);
}

function withList(state: State, key: string, items: TaxonomyItem[]): State {
  if (isBuiltIn(key)) {
    return { ...state, taxonomies: { ...state.taxonomies, [key]: items } };
  }
  return {
    ...state,
    customGroups: state.customGroups.map((group) =>
      group.key === key ? { ...group, items } : group,
    ),
  };
}

export function TaxonomyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<State>(() => ({
    taxonomies: structuredClone(defaultTaxonomies),
    customGroups: [],
  }));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<TaxonomyKey, unknown>> & {
        customGroups?: unknown;
      };
      setState({
        taxonomies: {
          departments: normalizeList(parsed.departments, defaultTaxonomies.departments),
          workTypes: normalizeList(parsed.workTypes, defaultTaxonomies.workTypes),
          salaries: normalizeList(parsed.salaries, defaultTaxonomies.salaries),
          experiences: normalizeList(parsed.experiences, defaultTaxonomies.experiences),
          locations: normalizeList(parsed.locations, defaultTaxonomies.locations),
        },
        customGroups: normalizeGroups(parsed.customGroups),
      });
    } catch {
      /* ignore malformed storage */
    } finally {
      setReady(true);
    }
  }, []);

  const update = useCallback((updater: (current: State) => State) => {
    setState((current) => {
      const next = updater(current);
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...next.taxonomies, customGroups: next.customGroups }),
        );
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  const addItem = useCallback(
    (key: string, label?: Localized) =>
      update((current) => {
        const value = label ?? { vi: "", en: "" };
        const list = listOf(current, key);
        const id = makeTaxonomyId(value.en || value.vi || "muc-moi", list);
        return withList(current, key, [...list, { id, label: value }]);
      }),
    [update],
  );

  const updateItem = useCallback(
    (key: string, id: string, label: Localized) =>
      update((current) =>
        withList(
          current,
          key,
          listOf(current, key).map((entry) => (entry.id === id ? { ...entry, label } : entry)),
        ),
      ),
    [update],
  );

  const moveItem = useCallback(
    (key: string, id: string, direction: -1 | 1) =>
      update((current) => {
        const list = [...listOf(current, key)];
        const index = list.findIndex((entry) => entry.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= list.length) return current;
        const moved = list[index]!;
        list[index] = list[target]!;
        list[target] = moved;
        return withList(current, key, list);
      }),
    [update],
  );

  const removeItem = useCallback(
    (key: string, id: string) =>
      update((current) =>
        withList(
          current,
          key,
          listOf(current, key).filter((entry) => entry.id !== id),
        ),
      ),
    [update],
  );

  const addGroup = useCallback(
    (label: Localized) =>
      update((current) => {
        const existing = current.customGroups.map((group) => ({ id: group.key, label: group.label }));
        const key = makeTaxonomyId(label.en || label.vi || "nhom-moi", existing);
        return { ...current, customGroups: [...current.customGroups, { key, label, items: [] }] };
      }),
    [update],
  );

  const removeGroup = useCallback(
    (key: string) =>
      update((current) => ({
        ...current,
        customGroups: current.customGroups.filter((group) => group.key !== key),
      })),
    [update],
  );

  const resetTaxonomies = useCallback(() => {
    update(() => ({ taxonomies: structuredClone(defaultTaxonomies), customGroups: [] }));
  }, [update]);

  const value = useMemo<TaxonomyValue>(
    () => ({
      ready,
      taxonomies: state.taxonomies,
      customGroups: state.customGroups,
      addItem,
      updateItem,
      moveItem,
      removeItem,
      addGroup,
      removeGroup,
      resetTaxonomies,
    }),
    [ready, state, addItem, updateItem, moveItem, removeItem, addGroup, removeGroup, resetTaxonomies],
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
