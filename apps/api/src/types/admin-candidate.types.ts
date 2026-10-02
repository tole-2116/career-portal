export type AdminCandidateStatus =
  | "NEW"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export interface AdminCandidateFilterQuery {
  page?: number;
  limit?: number;
  status?: AdminCandidateStatus;
  jobId?: string;
  search?: string;
}

export interface AdminCandidateLocalizedText {
  vi: string;
  en: string;
}

export interface AdminCandidateListItem {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: AdminCandidateLocalizedText;
  status: AdminCandidateStatus;
  rating: number;
  appliedAt: string;
  cvFile: string;
  location: AdminCandidateLocalizedText;
  experience: AdminCandidateLocalizedText;
  highlights: AdminCandidateLocalizedText[];
  notes: Array<{
    author: string;
    at: string;
    body: AdminCandidateLocalizedText;
  }>;
}

export interface AdminCandidatePaginatedResponse {
  candidates: AdminCandidateListItem[];
  total: number;
  page: number;
  totalPages: number;
}

/** Body của `PATCH /api/admin/candidates/:id/status`. */
export interface AdminCandidateStatusPayload {
  status: AdminCandidateStatus;
}

/** Body của `PUT /api/admin/candidates/:id`. */
export interface AdminCandidateUpdatePayload {
  name: string;
  email: string;
  phone: string;
  resumeUrl: string;
  jobId: string;
  status: AdminCandidateStatus;
  notes: string;
}
