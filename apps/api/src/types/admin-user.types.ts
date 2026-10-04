export type AdminUserRole = "ADMIN" | "RECRUITER";

export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateAdminUserInput {
  email: string;
  name: string;
  password: string;
  role: AdminUserRole;
}

export interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: AdminUserRole;
  active?: boolean;
}

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: AdminUserRole;
  active: boolean;
  createdAt: string;
}

export interface AdminUserListResult {
  users: AdminUserDto[];
  total: number;
  page: number;
  totalPages: number;
}
