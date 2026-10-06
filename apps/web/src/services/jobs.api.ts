import type { Job } from "@/data/jobs";
import { ApiError, apiRequest } from "@/lib/api/request";
import { mapApiJob, type ApiJob } from "@/lib/api/jobs";

const PUBLIC_BASE = "/api/jobs";

type PublicJobListResponse = {
  jobs: ApiJob[];
  total: number;
  page: number;
  totalPages: number;
};

export type PublicJobListParams = {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  locationIds?: string;
  workTypeId?: string;
  salaryId?: string;
  experienceId?: string;
};

function queryString(params: PublicJobListParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export async function fetchPublicJobs(
  params: PublicJobListParams = {},
): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
  const result = await apiRequest<PublicJobListResponse>(
    `${PUBLIC_BASE}${queryString(params)}`,
    { authenticated: false },
  );

  return {
    jobs: (result?.jobs ?? []).map(mapApiJob),
    total: result?.total ?? 0,
    page: result?.page ?? 1,
    totalPages: result?.totalPages ?? 1,
  };
}

export async function fetchPublicJob(id: string): Promise<Job | null> {
  try {
    const result = await apiRequest<ApiJob>(
      `${PUBLIC_BASE}/${encodeURIComponent(id)}`,
      { authenticated: false },
    );
    return result ? mapApiJob(result) : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
