import { apiRequest } from "@/lib/api/request";
import type { CustomGroup, Taxonomies, TaxonomyItem } from "@/lib/taxonomy-store";
import type { Localized } from "@/lib/i18n";

const BASE = "/api/admin/taxonomies";

type ApiItem = { id: string; code: string; type: string; label: Localized };
type ApiGroup = { key: string; label: Localized; items: ApiItem[] };
type ApiResult = {
  taxonomies: Record<"department" | "workType" | "salary" | "experience" | "location", ApiItem[]>;
  customGroups: ApiGroup[];
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(input, init);
}

function mapItem(item: ApiItem): TaxonomyItem {
  return { id: item.id, label: item.label };
}

/** Backend dùng type số ít; UI dùng key số nhiều của taxonomy-store. */
const TYPE_BY_GROUP_KEY: Record<string, string> = {
  departments: "department",
  workTypes: "workType",
  salaries: "salary",
  experiences: "experience",
  locations: "location",
};

export async function fetchAdminTaxonomies(): Promise<{ taxonomies: Taxonomies; customGroups: CustomGroup[] }> {
  const result = await request<ApiResult>(BASE);
  return {
    taxonomies: {
      departments: (result.taxonomies.department ?? []).map(mapItem),
      workTypes: (result.taxonomies.workType ?? []).map(mapItem),
      salaries: (result.taxonomies.salary ?? []).map(mapItem),
      experiences: (result.taxonomies.experience ?? []).map(mapItem),
      locations: (result.taxonomies.location ?? []).map(mapItem),
    },
    customGroups: (result.customGroups ?? []).map((group) => ({
      key: group.key,
      label: group.label,
      items: group.items.map(mapItem),
    })),
  };
}

export async function createTaxonomyItem(type: string, label: Localized): Promise<TaxonomyItem> {
  const result = await request<ApiItem>(BASE, {
    method: "POST",
    body: JSON.stringify({ type: TYPE_BY_GROUP_KEY[type] ?? type, label }),
  });
  return mapItem(result);
}

export async function updateTaxonomyItem(id: string, label: Localized): Promise<TaxonomyItem> {
  const result = await request<ApiItem>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ label }),
  });
  return mapItem(result);
}

export async function moveTaxonomyItem(id: string, direction: -1 | 1): Promise<void> {
  await request<null>(`${BASE}/${encodeURIComponent(id)}/move`, {
    method: "PUT",
    body: JSON.stringify({ direction }),
  });
}

export async function deleteTaxonomyItem(id: string): Promise<void> {
  await request<null>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function createCustomGroup(label: Localized): Promise<void> {
  await request<ApiGroup>(`${BASE}/groups`, {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export async function deleteCustomGroup(key: string): Promise<void> {
  await request<null>(`${BASE}/groups/${encodeURIComponent(key)}`, { method: "DELETE" });
}

export async function resetTaxonomies(): Promise<{ taxonomies: Taxonomies; customGroups: CustomGroup[] }> {
  await request<ApiResult>(`${BASE}/reset`, { method: "POST" });
  return fetchAdminTaxonomies();
}
