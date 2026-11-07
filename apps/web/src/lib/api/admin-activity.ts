import type { Localized } from "@/lib/i18n";
import { apiRequest } from "@/lib/api/request";

export interface AdminActivity {
  type: "job" | "application";
  at: string;
  text: Localized;
}

export function fetchAdminActivity(): Promise<AdminActivity[]> {
  return apiRequest<AdminActivity[]>("/api/admin/activity");
}
