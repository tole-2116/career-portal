import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { jobs as sampleJobs, type Job } from "@/data/jobs";
import type { Localized } from "@/lib/i18n";
import { useTaxonomies, type Taxonomies, type TaxonomyItem } from "@/lib/taxonomy-store";

const STORAGE_KEY = "talenthub-jobs";

const emptyLocalized: Localized = { vi: "", en: "" };

function localized(value: unknown, fallback: Localized = emptyLocalized): Localized {
  if (value && typeof value === "object") {
    const v = value as Partial<Localized>;
    return { vi: typeof v.vi === "string" ? v.vi : "", en: typeof v.en === "string" ? v.en : "" };
  }
  return { ...fallback };
}

function localizedList(value: unknown): Localized[] {
  return Array.isArray(value) ? value.map((item) => localized(item)) : [];
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function matchTaxonomyId(value: Localized | undefined, list: TaxonomyItem[]): string | undefined {
  if (!value) return undefined;
  const match = list.find(
    (entry) =>
      (value.en && entry.label.en === value.en) || (value.vi && entry.label.vi === value.vi),
  );
  return match?.id;
}

function resolveItem(id: string | undefined, value: Localized | undefined, list: TaxonomyItem[]) {
  const resolvedId = id && list.some((entry) => entry.id === id) ? id : matchTaxonomyId(value, list);
  const item = list.find((entry) => entry.id === resolvedId);
  return { id: item?.id, label: item ? { ...item.label } : { ...emptyLocalized } };
}

/** Links legacy labels to stable catalogue IDs and refreshes labels after catalogue edits. */
function syncJobTaxonomies(job: Job, taxonomies: Taxonomies): Job {
  const department = resolveItem(job.departmentId, job.department, taxonomies.departments);
  const workType = resolveItem(job.workTypeId, job.workType, taxonomies.workTypes);
  const salary = resolveItem(job.salaryId, job.salary, taxonomies.salaries);
  const experience = resolveItem(job.experienceId, job.experience, taxonomies.experiences);
  const locationIds = (job.locationIds?.length
    ? job.locationIds
    : job.locations.map((location) => matchTaxonomyId(location, taxonomies.locations))
  ).filter((id): id is string => Boolean(id && taxonomies.locations.some((item) => item.id === id)));
  const uniqueLocationIds = Array.from(new Set(locationIds));

  return {
    ...job,
    departmentId: department.id,
    department: department.label,
    workTypeId: workType.id,
    workType: workType.label,
    salaryId: salary.id,
    salary: salary.label,
    experienceId: experience.id,
    experience: experience.id ? experience.label : undefined,
    locationIds: uniqueLocationIds,
    locations: uniqueLocationIds
      .map((id) => taxonomies.locations.find((item) => item.id === id)?.label)
      .filter((label): label is Localized => Boolean(label))
      .map((label) => ({ ...label })),
  };
}

/** Reads the multi-location field, upgrading older single-location saves. */
function jobLocations(raw: Partial<Job> & { location?: unknown }): Localized[] {
  if (Array.isArray(raw.locations)) {
    return localizedList(raw.locations).filter((item) => item.vi || item.en);
  }
  const legacy = localized(raw.location);
  return legacy.vi || legacy.en ? [legacy] : [];
}

const jobStatuses = ["draft", "open", "paused", "expired", "closed"] as const;

function isJobStatus(value: unknown): value is Job["status"] {
  return typeof value === "string" && (jobStatuses as readonly string[]).includes(value);
}

/** Normalises a stored job so older saves never miss newer fields. */
function normalize(raw: unknown): Job | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Partial<Job> & { id?: unknown };
  if (typeof j.id !== "string" || !j.id) return null;
  return {
    id: j.id,
    title: localized(j.title),
    departmentId: optionalString(j.departmentId),
    department: localized(j.department),
    locationIds: Array.isArray(j.locationIds)
      ? j.locationIds.filter((id): id is string => typeof id === "string")
      : undefined,
    locations: jobLocations(j),
    workTypeId: optionalString(j.workTypeId),
    workType: localized(j.workType),
    level: localized(j.level),
    salaryId: optionalString(j.salaryId),
    salary: localized(j.salary),
    posted: typeof j.posted === "string" ? j.posted : "",
    deadline: typeof j.deadline === "string" ? j.deadline : "",
    status: isJobStatus(j.status) ? j.status : "open",
    applicants: typeof j.applicants === "number" ? j.applicants : 0,
    featured: j.featured === true,
    summary: localized(j.summary),
    description: localizedList(j.description),
    requirements: localizedList(j.requirements),
    benefits: localizedList(j.benefits),
    extraFields: Array.isArray(j.extraFields) ? j.extraFields : [],
    headcount: typeof j.headcount === "number" ? j.headcount : undefined,
    experienceId: optionalString(j.experienceId),
    experience: j.experience ? localized(j.experience) : undefined,
    languages: j.languages ? localized(j.languages) : undefined,
    contactName: typeof j.contactName === "string" ? j.contactName : undefined,
    contactEmail: typeof j.contactEmail === "string" ? j.contactEmail : undefined,
  };
}

/** Postings visible on the career site: only live "open" ones. */
export function isPublicJob(job: Job): boolean {
  return job.status === "open";
}

/** Flips expired postings ("open" past their deadline) to the expired status. */
export function applyExpiry(list: Job[]): Job[] {
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;
  const next = list.map((job) => {
    if (job.status !== "open" || !job.deadline || job.deadline >= today) return job;
    changed = true;
    return { ...job, status: "expired" as const };
  });
  return changed ? next : list;
}

export function makeJobId(title: string, existing: Job[]): string {
  const base =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) || "vi-tri";
  let id = base;
  let i = 2;
  while (existing.some((job) => job.id === id)) {
    id = `${base}-${i}`;
    i += 1;
  }
  return id;
}

export function emptyJob(): Job {
  return {
    id: "",
    title: { ...emptyLocalized },
    departmentId: undefined,
    department: { ...emptyLocalized },
    locationIds: [],
    locations: [],
    workTypeId: "full-time",
    workType: { vi: "Toàn thời gian", en: "Full-time" },
    level: { vi: "Trung cấp", en: "Mid-level" },
    salaryId: undefined,
    salary: { ...emptyLocalized },
    posted: new Date().toISOString().slice(0, 10),
    deadline: "",
    status: "open",
    applicants: 0,
    featured: false,
    summary: { ...emptyLocalized },
    description: [],
    requirements: [],
    benefits: [],
    extraFields: [],
  };
}

type JobsValue = {
  jobs: Job[];
  saveJob: (job: Job) => boolean;
  deleteJob: (id: string) => void;
  resetJobs: () => void;
};

const JobsContext = createContext<JobsValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const { ready: taxonomiesReady, taxonomies } = useTaxonomies();
  const [list, setList] = useState<Job[]>(sampleJobs);

  useEffect(() => {
    let base = sampleJobs;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const stored = parsed.map(normalize).filter((job): job is Job => job !== null);
          if (stored.length) base = stored;
        }
      }
    } catch {
      /* ignore malformed stored jobs */
    }
    const next = applyExpiry(base);
    setList(next);
    if (next !== base) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
    }
  }, []);

  useEffect(() => {
    if (!taxonomiesReady) return;
    setList((current) => {
      const next = current.map((job) => syncJobTaxonomies(job, taxonomies));
      if (JSON.stringify(next) === JSON.stringify(current)) return current;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, [taxonomiesReady, taxonomies]);

  const persist = useCallback((next: Job[]) => {
    setList(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }, []);

  const saveJob = useCallback((job: Job) => {
    let ok = false;
    setList((current) => {
      const exists = current.some((item) => item.id === job.id);
      const next = exists
        ? current.map((item) => (item.id === job.id ? job : item))
        : [job, ...current];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        ok = true;
      } catch {
        ok = false;
      }
      return next;
    });
    return ok;
  }, []);

  const deleteJob = useCallback((id: string) => {
    setList((current) => {
      const next = current.filter((item) => item.id !== id);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  }, []);

  const resetJobs = useCallback(() => {
    const next = sampleJobs.map((job) => syncJobTaxonomies(job, taxonomies));
    persist(next);
    window.localStorage.removeItem(STORAGE_KEY);
    setList(next);
  }, [persist, taxonomies]);

  const value = useMemo<JobsValue>(
    () => ({ jobs: list, saveJob, deleteJob, resetJobs }),
    [list, saveJob, deleteJob, resetJobs],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): JobsValue {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used inside JobsProvider");
  return ctx;
}

