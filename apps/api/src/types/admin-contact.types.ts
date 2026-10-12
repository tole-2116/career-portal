export interface AdminContactListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminContactDto {
  id: string;
  code: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  createdAt: string;
}

export interface AdminContactListResult {
  contacts: AdminContactDto[];
  total: number;
  page: number;
  totalPages: number;
}
