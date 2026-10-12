import { apiRequest } from "@/lib/api/request";

export type OpenApplicationPayload = {
  name: string;
  email: string;
  phone: string;
  note: string;
  cv: File;
};

/**
 * POST /api/open-applications — nộp hồ sơ tự do (không gắn tin).
 * Trả về id/code hồ sơ vừa lưu; trùng email/phone ném ApiError (409).
 */
export async function submitOpenApplication(
  payload: OpenApplicationPayload,
): Promise<{ id: string; code: string }> {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("email", payload.email);
  form.append("phone", payload.phone);
  if (payload.note) form.append("note", payload.note);
  form.append("cv", payload.cv, payload.cv.name);

  return apiRequest<{ id: string; code: string }>("/api/open-applications", {
    authenticated: false,
    method: "POST",
    body: form,
  });
}
