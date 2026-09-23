/** Admin console sections used for role based access control. */
export type AdminSection =
  | "overview"
  | "jobs"
  | "candidates"
  | "news"
  | "forms"
  | "taxonomies"
  | "settings"
  | "users";

export type UserRole = "admin" | "mod";

const modSections: AdminSection[] = ["overview", "jobs", "news", "taxonomies"];

export const allSections: AdminSection[] = [
  "overview",
  "jobs",
  "candidates",
  "news",
  "forms",
  "taxonomies",
  "settings",
  "users",
];

export function sectionsFor(role: UserRole): AdminSection[] {
  return role === "admin" ? allSections : modSections;
}

export function canAccess(role: UserRole, section: AdminSection): boolean {
  return sectionsFor(role).includes(section);
}

/** Maps an admin pathname to the section it belongs to. */
export function sectionForPath(pathname: string): AdminSection {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/admin" || clean === "") return "overview";
  const slug = clean.replace("/admin/", "").split("/")[0] ?? "";
  const map: Record<string, AdminSection> = {
    jobs: "jobs",
    candidates: "candidates",
    news: "news",
    forms: "forms",
    taxonomies: "taxonomies",
    settings: "settings",
    users: "users",
  };
  return map[slug] ?? "overview";
}
