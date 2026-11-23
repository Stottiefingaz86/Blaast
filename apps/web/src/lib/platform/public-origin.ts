import type { NextRequest } from "next/server";

/**
 * Stable public site origin for OAuth redirect_uri (must match Google Console).
 * Prefer explicit env so Vercel preview hosts don't break the registered URI.
 */
export function publicOrigin(req: NextRequest): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BLAAST_PUBLIC_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      /* fall through */
    }
  }
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isHttpsRequest(req: NextRequest): boolean {
  const origin = publicOrigin(req);
  return origin.startsWith("https://");
}
