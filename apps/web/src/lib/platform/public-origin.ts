import type { NextRequest } from "next/server";

/**
 * Stable public site origin for OAuth redirect_uri (must match Google Console).
 * Localhost always uses the request host so local OAuth works even when
 * NEXT_PUBLIC_APP_URL points at production.
 */
export function publicOrigin(req: NextRequest): string {
  const hostHeader =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const host = hostHeader.split(",")[0]?.trim() ?? "";
  const protoHeader = req.headers.get("x-forwarded-proto") ?? "http";
  const proto = protoHeader.split(",")[0]?.trim() || "http";

  if (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
  ) {
    return `http://${host}`;
  }

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
  if (host) return `${proto}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function isHttpsRequest(req: NextRequest): boolean {
  const origin = publicOrigin(req);
  return origin.startsWith("https://");
}
