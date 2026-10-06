import { redirect } from "@tanstack/react-router";

import { getApiToken } from "@/lib/auth-store";
import { getTokenExpiryMs, expireLocalSession } from "@/lib/admin-auth";

/**
 * beforeLoad guard cho các route admin: chặn khi chưa đăng nhập hoặc token hết hạn.
 * Đây là lớp defense-in-depth phía client; backend vẫn là nơi quyết định quyền.
 */
export function requireAdminSession(locationPathname: string): void {
  if (typeof window === "undefined") return;

  const token = getApiToken();
  const expiresAt = token ? getTokenExpiryMs(token) : null;
  const expired = expiresAt !== null && expiresAt <= Date.now();

  if (!token || expired) {
    if (token) expireLocalSession();
    throw redirect({
      to: "/admin/login",
      search: { returnTo: locationPathname },
    });
  }
}