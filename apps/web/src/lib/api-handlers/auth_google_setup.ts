import { NextRequest, NextResponse } from "next/server";
import { publicOrigin } from "@/lib/platform/public-origin";

export const runtime = "nodejs";

/**
 * Public helper for redirect_uri_mismatch — shows the exact URIs Google must allow.
 * No secrets.
 */
export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const redirectUri = `${origin}/api/auth/google/callback`;
  return NextResponse.json({
    ok: Boolean(clientId),
    clientIdSuffix: clientId ? clientId.slice(-20) : null,
    authorizedJavaScriptOrigins: [
      "http://localhost:3000",
      origin,
      "https://blaast-five.vercel.app",
    ].filter((v, i, a) => a.indexOf(v) === i),
    authorizedRedirectUris: [
      "http://localhost:3000/api/auth/google/callback",
      redirectUri,
      "https://blaast-five.vercel.app/api/auth/google/callback",
    ].filter((v, i, a) => a.indexOf(v) === i),
    googleCredentialsUrl: "https://console.cloud.google.com/apis/credentials",
    note: "Paste every redirect URI into the OAuth Web client. Scheme/host/path must match exactly (no trailing slash).",
  });
}
