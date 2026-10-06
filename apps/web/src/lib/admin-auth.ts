import { clearApiAuth } from "@/lib/auth-store";

export const ADMIN_LOGIN_PATH = "/admin/login";

/** Decode JWT chỉ để kiểm tra hạn hiệu lực phía client; không dùng cho phân quyền. */
export function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: unknown;
    };
    return typeof decoded.exp === "number" && Number.isFinite(decoded.exp) ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Chuyển hướng về đăng nhập sau khi phiên không còn hợp lệ. */
export function redirectToAdminLogin(returnTo?: string): string {
  if (!returnTo) return ADMIN_LOGIN_PATH;
  // Chỉ chấp nhận đường dẫn nội bộ để tránh open redirect.
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return ADMIN_LOGIN_PATH;
  return `${ADMIN_LOGIN_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

/** Xóa access token + session; refresh cookie đã được thu hồi bởi backend. */
export function expireLocalSession(): void {
  clearApiAuth();
}
