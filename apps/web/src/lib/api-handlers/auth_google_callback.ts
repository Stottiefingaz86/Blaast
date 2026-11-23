import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/platform/auth";
import { trackEvent } from "@/lib/platform/analytics-store";
import { upsertOAuthUser } from "@/lib/platform/users-store";
import { isHttpsRequest, publicOrigin } from "@/lib/platform/public-origin";

export const runtime = "nodejs";

function fail(origin: string, message: string) {
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(message)}`,
  );
}

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const oauthError = req.nextUrl.searchParams.get("error");
  if (oauthError) {
    if (oauthError === "access_denied") {
      return fail(
        origin,
        "Google sign-in was cancelled — or your email isn’t on the OAuth test-user list yet.",
      );
    }
    return fail(origin, `Google sign-in error: ${oauthError}`);
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("blaast_oauth_state")?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return fail(origin, "Google sign-in is not configured (missing env)");
  }
  if (!code) {
    return fail(origin, "Google sign-in failed — no authorization code");
  }
  if (!state || !cookieState || state !== cookieState) {
    return fail(
      origin,
      "Google sign-in expired — try Continue with Google again",
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
    let detail = "Google token exchange failed";
    try {
      const body = (await tokenRes.json()) as { error?: string; error_description?: string };
      if (body.error === "redirect_uri_mismatch") {
        detail =
          "Redirect URI mismatch — add https://blaast-five.vercel.app/api/auth/google/callback in Google Cloud";
      } else if (body.error_description) {
        detail = body.error_description.slice(0, 160);
      } else if (body.error) {
        detail = body.error;
      }
    } catch {
      /* ignore */
    }
    return fail(origin, detail);
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    return fail(origin, "No Google access token");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    return fail(origin, "Could not load Google profile");
  }
  const profile = (await profileRes.json()) as {
    email?: string;
    name?: string;
  };
  if (!profile.email) {
    return fail(origin, "Google account has no email");
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
  // Ensure Secure matches the live origin (not only NODE_ENV)
  if (isHttpsRequest(req)) {
    const token = res.cookies.get("blaast_session")?.value;
    if (token) {
      res.cookies.set("blaast_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }
  res.cookies.set("blaast_oauth_state", "", {
    path: "/",
    maxAge: 0,
    secure: isHttpsRequest(req),
  });
  return res;
}
