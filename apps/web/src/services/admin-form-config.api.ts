import { apiRequest } from "@/lib/api/request";
import type { FormConfig } from "@/lib/form-config";

const BASE = "/api/admin/form-config";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(input, init);
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
