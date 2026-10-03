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

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const sessionData = window.localStorage.getItem(SESSION_KEY);
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

      // Session cũ (trước khi có JWT) không kèm token → xóa để buộc login lại
      if (sessionData && !token) {
        window.localStorage.removeItem(SESSION_KEY);
      } else if (sessionData && token) {
        setCurrentUser(JSON.parse(sessionData) as AdminUser);
      }
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  const login = useCallback<AuthValue["login"]>(async (username, password) => {
    try {
      // Gọi API xác thực — nguồn chân thực duy nhất
      const response = await fetch("/api/auth/login", {
        method: "POST",
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

      // Lưu JWT và user info
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);

      return { ok: true };
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      return { ok: false, error: "Network error" };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      /* ignore */
    }
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
