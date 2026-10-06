import { db } from "@career-portal/database";
import { createRefreshToken, hashToken } from "../middleware/auth";
import { env } from "../config/env";

interface RefreshSession {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
}

export const authService = {
  async createRefreshSession(
    userId: string,
    userAgent: string | undefined,
    ipAddress: string | undefined,
  ): Promise<string> {
    const rawToken = createRefreshToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000);

    await db.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
        userAgent: userAgent?.slice(0, 500),
        ipAddress: ipAddress?.slice(0, 45),
      },
    });

    return rawToken;
  },

  async validateRefreshToken(rawToken: string): Promise<RefreshSession | null> {
    const tokenHash = hashToken(rawToken);
    const session = await db.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
        replacedById: true,
      },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt < new Date()) return null;

    // Check if user is still active
    const user = await db.user.findFirst({
      where: { id: session.userId, isdelete: false },
      select: { id: true },
    });
    if (!user) return null;

    return session;
  },

  async rotateRefreshToken(
    oldToken: string,
    userAgent: string | undefined,
    ipAddress: string | undefined,
  ): Promise<{ userId: string; newToken: string } | { error: string; revokeAll?: boolean }> {
    const oldHash = hashToken(oldToken);
    const session = await db.refreshToken.findUnique({
      where: { tokenHash: oldHash },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        replacedById: true,
        expiresAt: true,
      },
    });

    if (!session) {
      return { error: "Invalid refresh token" };
    }

    // Reuse detection: token was already replaced
    if (session.replacedById) {
      console.warn(`[AUTH] Refresh token reuse detected for user ${session.userId}`);
      await this.revokeAllUserSessions(session.userId);
      return { error: "Token reuse detected", revokeAll: true };
    }

    if (session.revokedAt) {
      return { error: "Token already revoked" };
    }

    if (session.expiresAt < new Date()) {
      return { error: "Token expired" };
    }

    // Create new refresh token
    const newRawToken = createRefreshToken();
    const newHash = hashToken(newRawToken);
    const expiresAt = new Date(Date.now() + env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000);

    const newSession = await db.refreshToken.create({
      data: {
        tokenHash: newHash,
        userId: session.userId,
        expiresAt,
        userAgent: userAgent?.slice(0, 500),
        ipAddress: ipAddress?.slice(0, 45),
      },
    });

    // Revoke old token and link to new one
    await db.refreshToken.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        replacedById: newSession.id,
      },
    });

    return { userId: session.userId, newToken: newRawToken };
  },

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserSessions(userId: string): Promise<void> {
    await db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async cleanupExpiredTokens(): Promise<number> {
    const result = await db.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  },
};
