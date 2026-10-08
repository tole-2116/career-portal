import type { ContactInput } from "@career-portal/types";

import { apiRequest } from "@/lib/api/request";

export type ContactPayload = ContactInput;

export async function submitContact(
  payload: ContactPayload,
): Promise<{ id: string; code: string | null }> {
  return apiRequest<{ id: string; code: string | null }>("/api/contacts", {
    authenticated: false,
    method: "POST",
    body: JSON.stringify(payload),
  });
}
