import { apiRequest } from "@/lib/api/request";

const BASE = "/api/admin/contacts";

type ApiContact = {
  id: string;
  code: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  status: ContactStatus;
  createdAt: string;
};

export type ContactStatus = "NEW" | "READ" | "RESOLVED";

type ApiListResult = {
  contacts: ApiContact[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminContact = ApiContact;

function mapContact(contact: ApiContact): AdminContact {
  return {
    id: contact.id,
    code: contact.code ?? null,
    name: contact.name,
    email: contact.email,
    phone: contact.phone ?? null,
    subject: contact.subject,
    body: contact.body,
    status: contact.status,
    createdAt: contact.createdAt,
  };
}

export async function fetchAdminContacts(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ contacts: AdminContact[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query}` : "";
  const result = await apiRequest<ApiListResult>(`${BASE}${suffix}`);
  return {
    contacts: (result?.contacts ?? []).map(mapContact),
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    totalPages: result?.totalPages ?? 1,
  };
}

export async function fetchAdminContact(id: string): Promise<AdminContact> {
  const result = await apiRequest<ApiContact>(`${BASE}/${encodeURIComponent(id)}`);
  return mapContact(result);
}

export async function updateAdminContactStatus(id: string, status: ContactStatus): Promise<AdminContact> {
  const result = await apiRequest<ApiContact>(`${BASE}/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return mapContact(result);
}
