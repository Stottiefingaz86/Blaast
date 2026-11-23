import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isHttpsRequest, publicOrigin } from "@/lib/platform/public-origin";

export const runtime = "nodejs";

/** Start Google OAuth — requires GOOGLE_CLIENT_ID (+ secret for callback). */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const origin = publicOrigin(req);
  if (!clientId) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Google sign-in is not configured yet (GOOGLE_CLIENT_ID)")}`,
    );
  }
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${origin}/api/auth/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  // Force account picker + consent so signup path is clear
  url.searchParams.set("include_granted_scopes", "true");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("blaast_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(req),
    path: "/",
    maxAge: 600,
  });
  return res;
}
