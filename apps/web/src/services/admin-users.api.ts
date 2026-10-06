import { apiRequest } from "@/lib/api/request";
import type { UserRole } from "@/lib/permissions";

const BASE = "/api/admin/users";

type ApiRole = "ADMIN" | "RECRUITER";

type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: ApiRole;
  active: boolean;
  createdAt: string;
};

type ApiListResult = {
  users: ApiUser[];
  total: number;
  page: number;
  totalPages: number;
};

export type AdminManagedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type AdminUserInput = {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  active?: boolean;
};

function mapRole(role: ApiRole): UserRole {
  return role === "ADMIN" ? "admin" : "mod";
}

function mapUser(user: ApiUser): AdminManagedUser {
  return { ...user, role: mapRole(user.role) };
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(input, init);
}

function roleToApi(role: UserRole): ApiRole {
  return role === "admin" ? "ADMIN" : "RECRUITER";
}

export async function fetchAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<{ users: AdminManagedUser[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  const suffix = query.toString() ? `?${query}` : "";
  const result = await request<ApiListResult>(`${BASE}${suffix}`);
  return {
    users: (result?.users ?? []).map(mapUser),
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    totalPages: result?.totalPages ?? 1,
  };
}

export async function createAdminUser(input: Required<AdminUserInput>): Promise<AdminManagedUser> {
  const result = await request<ApiUser>(BASE, {
    method: "POST",
    body: JSON.stringify({ ...input, role: roleToApi(input.role) }),
  });
  return mapUser(result);
}

export async function updateAdminUser(id: string, input: AdminUserInput): Promise<AdminManagedUser> {
  const result = await request<ApiUser>(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ ...input, role: input.role ? roleToApi(input.role) : undefined }),
  });
  return mapUser(result);
}

export async function deleteAdminUser(id: string): Promise<void> {
  await request<null>(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
