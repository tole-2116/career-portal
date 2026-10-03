import { Router, type Router as RouterType } from "express";
import bcrypt from "bcryptjs";
import { db } from "@career-portal/database";
import { signToken } from "../middleware/auth";

export const authRoutes: RouterType = Router();

// POST /api/auth/login — đổi credential (email) lấy JWT
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

    return res.json({
      success: true,
      data: {
        token: signToken(user.id),
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return res.status(500).json({ success: false, error: "Failed to login" });
  }
});

export default authRoutes;
