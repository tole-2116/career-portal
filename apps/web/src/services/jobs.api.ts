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
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  departmentId?: string | undefined;
  locationIds?: string | undefined;
  workTypeId?: string | undefined;
  salaryId?: string | undefined;
  experienceId?: string | undefined;
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

export type JobApplicationPayload = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  coverLetter?: string;
  formData: Record<string, string | boolean>;
  cv: File;
};

export async function submitJobApplication(
  jobId: string,
  payload: JobApplicationPayload,
): Promise<{ id: string }> {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("email", payload.email);
  form.append("phone", payload.phone);
  if (payload.address) form.append("address", payload.address);
  if (payload.coverLetter) form.append("coverLetter", payload.coverLetter);
  form.append("formData", JSON.stringify(payload.formData));
  form.append("cv", payload.cv, payload.cv.name);

  return apiRequest<{ id: string }>(
    `${PUBLIC_BASE}/${encodeURIComponent(jobId)}/apply`,
    {
      authenticated: false,
      method: "POST",
      body: form,
    },
  );
}
