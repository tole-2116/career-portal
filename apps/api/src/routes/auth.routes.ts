import { Router, type Router as RouterType } from "express";
import bcrypt from "bcryptjs";
import { db } from "@career-portal/database";
import { signAccessToken, requireAuth, hashToken } from "../middleware/auth";
import { authService } from "../services/auth.service";
import { env } from "../config/env";

export const authRoutes: RouterType = Router();

const REFRESH_COOKIE = "refreshToken";
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ("strict" as const) : ("lax" as const),
  path: "/api/auth",
  maxAge: env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000,
};

function clientMeta(req: { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string } }) {
  const userAgent = typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;
  const ipAddress = req.ip || req.socket?.remoteAddress;
  return { userAgent, ipAddress };
}

// POST /api/auth/login — đổi credential (email) lấy access token + refresh cookie
authRoutes.post("/login", async (req, res) => {
  try {
    const { email, username, password } = (req.body ?? {}) as {
      email?: unknown;
      username?: unknown;
      password?: unknown;
    };
    const identifier = typeof email === "string"
      ? email.trim().toLowerCase()
      : typeof username === "string" ? username.trim().toLowerCase() : "";
    if (!identifier || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, error: "Missing email or password" });
    }

    const user = await db.user.findFirst({
      where: {
        isdelete: false,
        OR: [
          { email: identifier },
          { code: identifier },
          { code: `user-${identifier}` },
        ],
      },
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const { userAgent, ipAddress } = clientMeta(req);
    const refreshToken = await authService.createRefreshSession(user.id, userAgent, ipAddress);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    return res.json({
      success: true,
      data: {
        token: signAccessToken(user.id),
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return res.status(500).json({ success: false, error: "Failed to login" });
  }
});

// POST /api/auth/refresh — dùng refresh cookie để lấy access token mới (có rotation)
authRoutes.post("/refresh", async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken || typeof rawToken !== "string") {
      return res.status(401).json({ success: false, error: "Missing refresh token", code: "REFRESH_MISSING" });
    }

    const { userAgent, ipAddress } = clientMeta(req);
    const result = await authService.rotateRefreshToken(rawToken, userAgent, ipAddress);

    if ("error" in result) {
      res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
      return res.status(401).json({
        success: false,
        error: result.error,
        code: result.revokeAll ? "REFRESH_REUSE" : "REFRESH_INVALID",
      });
    }

    res.cookie(REFRESH_COOKIE, result.newToken, refreshCookieOptions);
    return res.json({
      success: true,
      data: { token: signAccessToken(result.userId) },
    });
  } catch (error) {
    console.error("POST /api/auth/refresh error:", error);
    return res.status(500).json({ success: false, error: "Failed to refresh session" });
  }
});

// POST /api/auth/logout — thu hồi refresh session và xóa cookie
authRoutes.post("/logout", async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (rawToken && typeof rawToken === "string") {
      await authService.revokeRefreshToken(hashToken(rawToken));
    }
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    return res.json({ success: true, data: { loggedOut: true } });
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    return res.json({ success: true, data: { loggedOut: true } });
  }
});

// GET /api/auth/me — xác thực access token và trả user hiện tại từ DB
authRoutes.get("/me", requireAuth, (req, res) => {
  return res.json({ success: true, data: { user: req.user } });
});

export default authRoutes;
