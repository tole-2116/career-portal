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
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
};

const USERS_KEY = "talenthub-users";
const SESSION_KEY = "talenthub-session";

/** SHA-256 hash so plain passwords are never stored in the browser. */
export async function hashPassword(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-256 of "admin123" — the seeded administrator password. */
const DEFAULT_ADMIN_HASH =
  "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

function defaultUsers(): AdminUser[] {
  return [
    {
      id: "u-admin",
      username: "admin",
      name: "Quản trị viên",
      role: "admin",
      passwordHash: DEFAULT_ADMIN_HASH,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    },
  ];
}

const roles: UserRole[] = ["admin", "mod"];

/** Reject rows tampered with through browser storage (unknown roles, bad shapes). */
export function sanitizeUsers(input: unknown): AdminUser[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const clean: AdminUser[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object") continue;
    const u = row as Partial<AdminUser>;
    if (typeof u.id !== "string" || !u.id.trim()) continue;
    if (typeof u.username !== "string" || !u.username.trim()) continue;
    if (typeof u.passwordHash !== "string" || !/^[a-f0-9]{64}$/.test(u.passwordHash)) continue;
    if (!roles.includes(u.role as UserRole)) continue;
    const key = u.username.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({
      id: u.id,
      username: u.username.trim(),
      name: typeof u.name === "string" && u.name.trim() ? u.name.trim() : u.username.trim(),
      role: u.role as UserRole,
      passwordHash: u.passwordHash,
      active: u.active !== false,
      createdAt:
        typeof u.createdAt === "string" ? u.createdAt : new Date().toISOString().slice(0, 10),
    });
  }
  return clean.some((user) => user.role === "admin" && user.active) ? clean : [];
}

type AuthValue = {
  users: AdminUser[];
  currentUser: AdminUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  addUser: (input: {
    username: string;
    name: string;
    password: string;
    role: UserRole;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateUser: (
    id: string,
    patch: Partial<Pick<AdminUser, "name" | "role" | "active">> & { password?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
  removeUser: (id: string) => { ok: boolean; error?: string };
  can: (section: AdminSection) => boolean;
  /** True when the signed-in account still uses the seeded password. */
  usesDefaultPassword: boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(defaultUsers);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USERS_KEY);
      if (raw) {
        const clean = sanitizeUsers(JSON.parse(raw));
        if (clean.length) {
          setUsers(clean);
          window.localStorage.setItem(USERS_KEY, JSON.stringify(clean));
        } else {
          window.localStorage.removeItem(USERS_KEY);
          window.localStorage.removeItem(SESSION_KEY);
        }
      }
      setCurrentId(window.localStorage.getItem(SESSION_KEY));
    } catch {
      /* ignore malformed storage */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: AdminUser[]) => {
    setUsers(next);
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentId && user.active) ?? null,
    [users, currentId],
  );

  const login = useCallback<AuthValue["login"]>(
    async (username, password) => {
      const found = users.find(
        (user) => user.username.toLowerCase() === username.trim().toLowerCase(),
      );
      if (!found) return { ok: false, error: "notFound" };
      if (!found.active) return { ok: false, error: "locked" };
      const hash = await hashPassword(password);
      if (hash !== found.passwordHash) return { ok: false, error: "notFound" };
      setCurrentId(found.id);
      try {
        window.localStorage.setItem(SESSION_KEY, found.id);
      } catch {
        /* ignore */
      }
      return { ok: true };
    },
    [users],
  );

  const logout = useCallback(() => {
    setCurrentId(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const addUser = useCallback<AuthValue["addUser"]>(
    async ({ username, name, password, role }) => {
      const clean = username.trim().toLowerCase();
      if (!clean || !password) return { ok: false, error: "invalid" };
      if (users.some((user) => user.username.toLowerCase() === clean))
        return { ok: false, error: "duplicate" };
      const user: AdminUser = {
        id: `u-${Date.now()}`,
        username: clean,
        name: name.trim() || clean,
        role,
        passwordHash: await hashPassword(password),
        active: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      persist([...users, user]);
      return { ok: true };
    },
    [users, persist],
  );

  const updateUser = useCallback<AuthValue["updateUser"]>(
    async (id, patch) => {
      const target = users.find((user) => user.id === id);
      if (!target) return { ok: false, error: "notFound" };
      const nextRole = patch.role ?? target.role;
      const nextActive = patch.active ?? target.active;
      const activeAdmins = users.filter(
        (user) => user.role === "admin" && user.active && user.id !== id,
      ).length;
      if (activeAdmins === 0 && (nextRole !== "admin" || !nextActive))
        return { ok: false, error: "lastAdmin" };
      const passwordHash = patch.password
        ? await hashPassword(patch.password)
        : target.passwordHash;
      persist(
        users.map((user) =>
          user.id === id
            ? {
                ...user,
                name: patch.name?.trim() || user.name,
                role: nextRole,
                active: nextActive,
                passwordHash,
              }
            : user,
        ),
      );
      return { ok: true };
    },
    [users, persist],
  );

  const removeUser = useCallback<AuthValue["removeUser"]>(
    (id) => {
      const rest = users.filter((user) => user.id !== id);
      if (!rest.some((user) => user.role === "admin" && user.active))
        return { ok: false, error: "lastAdmin" };
      persist(rest);
      if (currentId === id) logout();
      return { ok: true };
    },
    [users, persist, currentId, logout],
  );

  const can = useCallback(
    (section: AdminSection) => (currentUser ? canAccess(currentUser.role, section) : false),
    [currentUser],
  );

  const usesDefaultPassword = currentUser?.passwordHash === DEFAULT_ADMIN_HASH;

  const value = useMemo<AuthValue>(
    () => ({
      users,
      currentUser,
      ready,
      login,
      logout,
      addUser,
      updateUser,
      removeUser,
      can,
      usesDefaultPassword,
    }),
    [
      users,
      currentUser,
      ready,
      login,
      logout,
      addUser,
      updateUser,
      removeUser,
      can,
      usesDefaultPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
