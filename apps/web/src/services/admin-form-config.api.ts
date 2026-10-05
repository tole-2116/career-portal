import { getApiToken } from "@/lib/auth-store";
import type { FormConfig } from "@/lib/form-config";

const BASE = "/api/admin/form-config";

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

export function fetchAdminFormConfig(): Promise<FormConfig> {
  return request<FormConfig>(BASE);
}

export function saveAdminFormConfig(config: FormConfig): Promise<FormConfig> {
  return request<FormConfig>(BASE, { method: "PUT", body: JSON.stringify(config) });
}

export function resetAdminFormConfig(): Promise<FormConfig> {
  return request<FormConfig>(`${BASE}/reset`, { method: "POST" });
}
