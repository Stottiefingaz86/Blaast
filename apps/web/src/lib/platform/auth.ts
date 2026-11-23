import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getUserById,
  toPublic,
  type PublicUser,
} from "@/lib/platform/users-store";

export const SESSION_COOKIE = "blaast_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return (
    process.env.BLAAST_AUTH_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    "blaast-dev-auth-secret-change-me"
  );
}

function sign(userId: string, exp: number): string {
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): { userId: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  if (!userId || !expStr || !sig) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const payload = `${userId}.${exp}`;
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return { userId, exp };
}

export function createSessionToken(userId: string): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  return sign(userId, exp);
}

export function setSessionCookie(res: NextResponse, userId: string) {
  const token = createSessionToken(userId);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const parsed = verify(token);
  if (!parsed) return null;
  const user = await getUserById(parsed.userId);
  if (!user) return null;
  return toPublic(user);
}

/** Full admin — Users, Analytics, Approve & publish. */
export async function requireAdmin(): Promise<PublicUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "owner" && user.role !== "admin") return null;
  return user;
}

/** Capture desk — owner, admin, or curator (curators cannot approve/publish). */
export async function requireStaff(): Promise<PublicUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (
    user.role !== "owner" &&
    user.role !== "admin" &&
    user.role !== "curator"
  ) {
    return null;
  }
  return user;
}

export function isPublisherRole(role: string | undefined | null): boolean {
  return role === "owner" || role === "admin";
}

export function isStaffRole(role: string | undefined | null): boolean {
  return role === "owner" || role === "admin" || role === "curator";
}

/** Best-effort user id from cookie for analytics (API routes with Request). */
export function userIdFromRequestCookie(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`),
  );
  if (!match?.[1]) return null;
  const parsed = verify(decodeURIComponent(match[1]));
  return parsed?.userId ?? null;
}
