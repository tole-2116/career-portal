import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@career-portal/database";

/** Secret từ env cho production; fallback dev local để dev server chạy được. */
const JWT_SECRET = process.env.JWT_SECRET || "career-portal-dev-secret";
const TOKEN_TTL = "8h";

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/** Xác thực Bearer token, load user active từ DB, gắn vào req.user. */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    return next();
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      return res.status(401).json({ success: false, error: "Missing bearer token" });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = typeof decoded === "string" ? decoded : String(decoded.sub ?? "");
    } catch {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid token payload" });
    }

    const user = await db.user.findFirst({
      where: { id: userId, isdelete: false },
      select: { id: true, name: true, role: true },
    });
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found or inactive" });
    }

    req.user = { id: user.id, name: user.name, role: user.role };
    return next();
  } catch (error) {
    console.error("auth middleware error:", error);
    return res.status(500).json({ success: false, error: "Authentication failed" });
  }
}
