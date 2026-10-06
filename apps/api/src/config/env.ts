import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET?.trim();

if (isProduction && (!jwtSecret || Buffer.byteLength(jwtSecret, "utf8") < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 bytes in production");
}

if (!jwtSecret) {
  console.warn("JWT_SECRET is not configured; using a development-only secret");
}

export const env = {
  isProduction,
  jwtSecret: jwtSecret || "career-portal-development-secret-change-me",
  jwtIssuer: process.env.JWT_ISSUER?.trim() || "career-portal-api",
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || "15m",
  jwtRefreshTtlDays: parsePositiveInteger(process.env.JWT_REFRESH_TTL_DAYS, 7),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
} as const;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
