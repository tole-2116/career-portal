import { getApiToken } from "@/lib/auth-store";
import type { SiteConfig } from "@/lib/site-config";

const PUBLIC_BASE = "/api/site-config";
const ADMIN_BASE = "/api/admin/site-config";

type ApiEnvelope<T> = { success: boolean; data: T; error?: string };

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const token = getApiToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Ignore non-JSON proxy responses and report the HTTP status below.
  }
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error || `Request failed with status ${response.status}`);
  }
  return body?.data as T;
}

export function fetchSiteConfig(): Promise<SiteConfig> {
  return request<SiteConfig>(PUBLIC_BASE);
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
