import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/platform/auth";
import { trackEvent } from "@/lib/platform/analytics-store";
import { upsertOAuthUser } from "@/lib/platform/users-store";

export const runtime = "nodejs";

function originFrom(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const origin = originFrom(req);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("blaast_oauth_state")?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Google sign-in failed")}`,
    );
  }
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Invalid OAuth state")}`,
    );
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Google token exchange failed")}`,
    );
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("No Google access token")}`,
    );
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Could not load Google profile")}`,
    );
  }
  const profile = (await profileRes.json()) as {
    email?: string;
    name?: string;
  };
  if (!profile.email) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Google account has no email")}`,
    );
  }

  const user = await upsertOAuthUser({
    email: profile.email,
    name: profile.name,
  });
  await trackEvent({
    kind: "login",
    userId: user.id,
    userEmail: user.email,
    meta: { provider: "google" },
  });

  const res = NextResponse.redirect(`${origin}/library`);
  setSessionCookie(res, user.id);
  res.cookies.set("blaast_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
