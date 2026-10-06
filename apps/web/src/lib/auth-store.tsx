import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { canAccess, type AdminSection, type UserRole } from "@/lib/permissions";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type ApiAuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

function normalizeApiUser(user: ApiAuthUser): AdminUser | null {
  const role = user.role.toUpperCase() === "ADMIN" ? "admin" :
    user.role.toUpperCase() === "RECRUITER" ? "mod" : null;
  if (!role || !user.id || !user.email || !user.name) return null;
  return { id: user.id, email: user.email, name: user.name, role };
}

const SESSION_KEY = "talenthub-session";
/** Key duy nhất cho JWT của API, dùng chung mọi nơi trong app. */
export const AUTH_TOKEN_KEY = "career-portal-api-token";

export function getApiToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    /* ignore storage failures */
  }
}

/** Xóa token + session khi API trả 401 để bắt buộc đăng nhập lại lấy JWT mới. */
export function clearApiAuth(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function decodeTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: unknown;
    };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

type AuthValue = {
  currentUser: AdminUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  can: (section: AdminSection) => boolean;
  /** Stub — user management chuyển sang backend API riêng sau. */
  users: AdminUser[];
  /** Stub — chưa implement. */
  addUser: (input: { username: string; name: string; password: string; role: UserRole }) => Promise<{ ok: boolean; error?: string }>;
  /** Stub — chưa implement. */
  updateUser: (id: string, patch: Partial<Pick<AdminUser, "name" | "role">> & { password?: string }) => Promise<{ ok: boolean; error?: string }>;
  /** Stub — chưa implement. */
  removeUser: (id: string) => { ok: boolean; error?: string };
  /** Stub — luôn trả false cho đến khi có password reset flow. */
  usesDefaultPassword: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restore + validate session on mount
  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setReady(true);
    };

    const restore = async () => {
      let sessionData: string | null = null;
      let token: string | null = null;
      try {
        sessionData = window.localStorage.getItem(SESSION_KEY);
        token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      } catch {
        finish();
        return;
      }

      // Session cũ (không kèm token) → xóa để buộc login lại
      if (!sessionData || !token) {
        if (sessionData) {
          try {
            window.localStorage.removeItem(SESSION_KEY);
          } catch {
            /* ignore */
          }
        }
        finish();
        return;
      }

      // Token hết hạn rõ ràng → xóa ngay, không cần gọi API
      const expiresAt = decodeTokenExpiry(token);
      if (expiresAt !== null && expiresAt <= Date.now()) {
        clearApiAuth();
        finish();
        return;
      }

      // Xác thực với server; nếu access token đã hết hạn, /me trả 401 nhưng
      // refresh cookie có thể còn hạn nên thử refresh qua /api/auth/refresh.
      try {
        let response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (response.status === 401) {
          const refreshed = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          if (refreshed.ok) {
            const body = (await refreshed.json()) as {
              success?: boolean;
              data?: { token?: string };
            };
            if (body.success && body.data?.token) {
              setApiToken(body.data.token);
              response = await fetch("/api/auth/me", {
                headers: { Authorization: `Bearer ${body.data.token}` },
                credentials: "include",
              });
            }
          }
        }

        if (response.ok) {
          const body = (await response.json()) as { data?: { user?: ApiAuthUser } };
          const normalized = body.data?.user ? normalizeApiUser(body.data.user) : null;
          if (normalized) {
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
            if (!cancelled) setCurrentUser(normalized);
          } else {
            clearApiAuth();
          }
        } else if (response.status === 401 || response.status === 403) {
          clearApiAuth();
        } else {
          // Server lỗi/không sẵn sàng → giữ session đã lưu
          const cached = JSON.parse(sessionData) as AdminUser;
          if (!cancelled) setCurrentUser(cached);
        }
      } catch {
        // Network error → dùng session đã lưu để app vẫn hoạt động
        try {
          const cached = JSON.parse(sessionData) as AdminUser;
          if (!cancelled) setCurrentUser(cached);
        } catch {
          clearApiAuth();
        }
      } finally {
        finish();
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Session bị vô hiệu hoá (401 + refresh thất bại) → xoá state
  useEffect(() => {
    const handler = () => setCurrentUser(null);
    window.addEventListener("career-portal:auth-expired", handler);
    return () => window.removeEventListener("career-portal:auth-expired", handler);
  }, []);

  const login = useCallback<AuthValue["login"]>(async (username, password) => {
    try {
      // Gọi API xác thực — nguồn chân thực duy nhất
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const body = (await response.json()) as {
        success?: boolean;
        data?: { token?: string; user?: ApiAuthUser };
        error?: string;
      };

      if (!response.ok || body.success === false || !body.data?.token || !body.data?.user) {
        return { ok: false, error: body.error || "Invalid credentials" };
      }

      const normalized = normalizeApiUser(body.data.user);
      if (!normalized) {
        return { ok: false, error: "Invalid user role" };
      }

      const { token } = body.data;

      // Lưu access token và user info; refresh token nằm trong HttpOnly cookie.
      setApiToken(token);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);

      return { ok: true };
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      return { ok: false, error: "Network error" };
    }
  }, []);

  const logout = useCallback(() => {
    // Revoke refresh session server-side, but never block local cleanup/navigation.
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    }).catch(() => undefined);
    setCurrentUser(null);
    clearApiAuth();
  }, []);

  const can = useCallback(
    (section: AdminSection) => (currentUser ? canAccess(currentUser.role, section) : false),
    [currentUser],
  );

  // ---- Stubs cho trang /admin/users (chưa kết nối backend) ----
  const users = useMemo<AdminUser[]>(() => (currentUser ? [currentUser] : []), [currentUser]);

  const addUser = useCallback<AuthValue["addUser"]>(async () => {
    return { ok: false, error: "notImplemented" };
  }, []);

  const updateUser = useCallback<AuthValue["updateUser"]>(async () => {
    return { ok: false, error: "notImplemented" };
  }, []);

  const removeUser = useCallback<AuthValue["removeUser"]>(() => {
    return { ok: false, error: "notImplemented" };
  }, []);

  const usesDefaultPassword = false;

  const value = useMemo<AuthValue>(
    () => ({
      currentUser,
      ready,
      login,
      logout,
      can,
      users,
      addUser,
      updateUser,
      removeUser,
      usesDefaultPassword,
    }),
    [currentUser, ready, login, logout, can, users, addUser, updateUser, removeUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
