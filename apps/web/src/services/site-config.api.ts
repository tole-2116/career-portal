import { apiRequest } from "@/lib/api/request";
import type { SiteConfig } from "@/lib/site-config";

const PUBLIC_BASE = "/api/site-config";
const ADMIN_BASE = "/api/admin/site-config";

async function request<T>(input: string, init?: RequestInit, authenticated = true): Promise<T> {
  return apiRequest<T>(input, { ...init, authenticated });
}

export function fetchSiteConfig(): Promise<SiteConfig> {
  return request<SiteConfig>(PUBLIC_BASE, undefined, false);
}

export function fetchAdminSiteConfig(): Promise<SiteConfig> {
  return request<SiteConfig>(ADMIN_BASE);
}

export function saveAdminSiteConfig(config: SiteConfig): Promise<SiteConfig> {
  return request<SiteConfig>(ADMIN_BASE, { method: "PUT", body: JSON.stringify(config) });
}

export function resetAdminSiteConfig(): Promise<SiteConfig> {
  return request<SiteConfig>(`${ADMIN_BASE}/reset`, { method: "POST" });
}
