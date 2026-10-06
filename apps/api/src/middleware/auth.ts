import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db } from "@career-portal/database";
import { env } from "../config/env";

const ACCESS_TOKEN_PURPOSE = "access" as const;

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: string;
}

type AccessTokenPayload = JwtPayload & {
  purpose?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, purpose: ACCESS_TOKEN_PURPOSE },
    env.jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: env.jwtAccessTtl as jwt.SignOptions["expiresIn"],
      issuer: env.jwtIssuer,
    },
  );
}

/** @deprecated Use signAccessToken for new sessions. */
export const signToken = signAccessToken;

export function createRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function authError(
  res: Response,
  status: number,
  error: string,
  code: string,
) {
  return res.status(status).json({ success: false, error, code });
}

/** Xác thực access token Bearer, sau đó luôn tải role mới nhất từ DB. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return authError(res, 401, "Authentication required", "TOKEN_MISSING");

  let userId: string;
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
      issuer: env.jwtIssuer,
    });
    if (typeof decoded === "string") {
      return authError(res, 401, "Invalid token", "TOKEN_INVALID");
    }

    const payload = decoded as AccessTokenPayload;
    if (
      typeof payload.sub !== "string" ||
      !payload.sub ||
      payload.purpose !== ACCESS_TOKEN_PURPOSE
    ) {
      return authError(res, 401, "Invalid token", "TOKEN_INVALID");
    }
    userId = payload.sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return authError(res, 401, "Token expired", "TOKEN_EXPIRED");
    }
    return authError(res, 401, "Invalid token", "TOKEN_INVALID");
  }

  try {
    const user = await db.user.findFirst({
      where: { id: userId, isdelete: false },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) return authError(res, 401, "User is inactive or not found", "USER_INACTIVE");

    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    return next();
  } catch (error) {
    console.error("auth middleware error:", error);
    return res.status(500).json({ success: false, error: "Authentication failed", code: "AUTH_ERROR" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return authError(res, 403, "Forbidden", "FORBIDDEN");
    }
    return next();
  };
}
