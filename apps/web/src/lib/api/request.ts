import { clearApiAuth, getApiToken, setApiToken } from "@/lib/auth-store";

export type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  code?: string;
  field?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly field: string | undefined;

  constructor(message: string, status: number, code?: string, field?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

let refreshPromise: Promise<string | null> | null = null;
let authExpiryDispatched = false;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const body = (await response.json()) as ApiResponse<{ token?: string }>;
      const token = body.data?.token;
      if (!body.success || !token) return null;
      setApiToken(token);
      return token;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function handleAuthFailure() {
  if (authExpiryDispatched) return;
  authExpiryDispatched = true;
  clearApiAuth();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("career-portal:auth-expired"));
  }
}

function resetAuthExpiryNotification() {
  authExpiryDispatched = false;
}

async function parseBody<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export type AuthenticatedRequestInit = RequestInit & {
  authenticated?: boolean;
  retryOnAuthFailure?: boolean;
};

/** Shared API client for authenticated and public requests. */
export async function apiRequest<T>(
  input: string,
  init: AuthenticatedRequestInit = {},
): Promise<T> {
  const { authenticated = true, retryOnAuthFailure = true, ...requestInit } = init;
  const token = authenticated ? getApiToken() : null;
  const headers = new Headers(requestInit.headers);

  if (!(requestInit.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(input, {
    ...requestInit,
    headers,
    credentials: "include",
  });
  const body = await parseBody<T>(response);

  if (response.status === 401 && authenticated && retryOnAuthFailure) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return apiRequest<T>(input, {
        ...init,
        retryOnAuthFailure: false,
      });
    }
    handleAuthFailure();
  } else if (response.ok && authenticated) {
    resetAuthExpiryNotification();
  }

  if (!response.ok || body?.success === false) {
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status,
      body?.code,
      body?.field,
    );
  }

  return body?.data as T;
}

export function resetAuthExpiryState() {
  resetAuthExpiryNotification();
}
