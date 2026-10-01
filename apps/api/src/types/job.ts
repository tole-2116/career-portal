export type LocaleStringModel = {
  en: string;
  vi?: string;
  [key: string]: string | undefined;
};

export type JobStatus = "DRAFT" | "OPEN" | "PAUSED" | "EXPIRED" | "CLOSED";

// Định nghĩa model dữ liệu Job đầu vào / thao tác
export interface JobModel {
  slug?: string;
  title: LocaleStringModel;
  summary?: LocaleStringModel;
  description: LocaleStringModel;
  requirements?: LocaleStringModel;
  benefits?: LocaleStringModel;
  departmentId: string;
  locationIds?: string | string[];
  workTypeId: string;
  salaryId?: string | null;
  experienceId?: string | null;
  level?: LocaleStringModel | string | null;
  languages?: LocaleStringModel | string | null;
  status?: JobStatus;
  isFeatured?: boolean;
  headcount?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
}

// Params phục vụ phân trang, lọc và tìm kiếm
export interface JobModelQuery {
  page?: number;
  limit?: number;
  status?: JobStatus;
  departmentId?: string;
  locationIds?: string;
  workTypeId?: string;
  salaryId?: string;
  experienceId?: string;
  search?: string;
}