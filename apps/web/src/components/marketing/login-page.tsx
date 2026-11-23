"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BlaastMark } from "@/components/brand/blaast-mark";
import { AuthScreenCollage } from "@/components/marketing/auth-screen-collage";
import { useSession } from "@/lib/library/session";
import { cn } from "@/lib/utils";

/** Mobbin-like auth chrome — soft charcoal, not pure black */
const fieldClass =
  "h-11 w-full rounded-xl border border-white/[0.16] bg-transparent px-4 text-[14px] text-white outline-none transition-colors placeholder:text-[#8a8a8a] focus:border-white/35";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85 2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function friendlyOAuthError(raw: string | null): string | null {
  if (!raw) return null;
  if (/GOOGLE_CLIENT_ID|not configured/i.test(raw)) {
    return "Google sign-in isn’t set up yet — use email below for now.";
  }
  if (/redirect_uri|redirect URI|mismatch/i.test(raw)) {
    return "Google blocked sign-in (redirect URI mismatch). Add the callback URL shown below in Google Cloud → Credentials.";
  }
  return raw;
}

export function LoginPage() {
  const { login, signup, loggedIn, ready } = useSession();
  const router = useRouter();
  const search = useSearchParams();
  const mode = search.get("mode") === "signup" ? "signup" : "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(
    friendlyOAuthError(search.get("error")),
  );
  const [loading, setLoading] = useState(false);
  const googleConfigured =
    typeof process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === "string" &&
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length > 0;

  useEffect(() => {
    if (ready && loggedIn) router.replace("/library");
  }, [ready, loggedIn, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === "signup"
          ? await signup(email.trim(), password, name || undefined)
          : await login(email.trim(), password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      window.location.assign("/library");
    } catch {
      setError("Something went wrong — try again");
      setLoading(false);
    }
  }

  const googleBtn = cn(
    "flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-white/[0.16] bg-transparent text-[14px] font-medium text-white transition-colors hover:bg-white/[0.04] active:scale-[0.99]",
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-[#121212] px-6 py-10 text-white sm:px-10">
        <div className="flex w-full max-w-[340px] flex-col items-center">
          <Link
            href="/"
            className="mb-8 inline-flex items-center justify-center"
            aria-label="Blaast home"
          >
            <BlaastMark className="h-8" tone="onDark" />
          </Link>

          <h1 className="animate-fade-up w-full text-center text-[1.75rem] font-semibold tracking-tight sm:text-[1.875rem]">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>

          <form
            onSubmit={onSubmit}
            className="animate-fade-up stagger-1 mt-6 w-full space-y-2.5"
          >
            {googleConfigured ? (
              <a href="/api/auth/google" className={googleBtn}>
                <GoogleMark className="size-[18px] shrink-0" />
                Continue with Google
              </a>
            ) : (
              <a
                href="/api/auth/google"
                className={googleBtn}
                title="Requires GOOGLE_CLIENT_ID — see docs/google-oauth.md"
              >
                <GoogleMark className="size-[18px] shrink-0" />
                Continue with Google
              </a>
            )}
            {(error && /redirect|mismatch|Google blocked/i.test(error)) ||
            search.get("oauth") === "setup" ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-left text-[11px] leading-relaxed text-amber-100/90">
                <p className="font-medium text-amber-50">
                  Add both callbacks in Google Cloud → Credentials (exact match):
                </p>
                <code className="mt-1 block break-all text-[10px] text-white/80">
                  https://blaast-five.vercel.app/api/auth/google/callback
                </code>
                <code className="mt-1 block break-all text-[10px] text-white/80">
                  http://localhost:3000/api/auth/google/callback
                </code>
                <a
                  className="mt-2 inline-block underline"
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Google Credentials →
                </a>
              </div>
            ) : null}
            <div className="flex items-center gap-3 py-0.5 text-[12px] text-[#8a8a8a]">
              <span className="h-px flex-1 bg-white/[0.12]" />
              or
              <span className="h-px flex-1 bg-white/[0.12]" />
            </div>
            {mode === "signup" && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                autoComplete="name"
                className={fieldClass}
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              autoComplete="email"
              className={fieldClass}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              required
              minLength={8}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className={fieldClass}
            />
            {error && (
              <p className="text-center text-[12px] text-[#c4c4c4]" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex h-11 w-full items-center justify-center rounded-full bg-white text-[14px] font-medium text-neutral-950 transition-transform hover:scale-[1.01] active:scale-[0.99]",
                loading && "opacity-70",
              )}
            >
              {loading
                ? mode === "signup"
                  ? "Creating account…"
                  : "Signing in…"
                : "Continue"}
            </button>
            <p className="pt-2 text-center text-[12px] text-[#8a8a8a]">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-2">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New here?{" "}
                  <Link
                    href="/login?mode=signup"
                    className="underline underline-offset-2"
                  >
                    Create an account
                  </Link>
                </>
              )}
            </p>
            <p className="pt-0.5 text-center text-[11px] leading-relaxed text-[#6e6e6e]">
              By continuing, you agree to Blaast&apos;s{" "}
              <span className="underline underline-offset-2">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="underline underline-offset-2">Privacy Policy</span>
              .
            </p>
          </form>
        </div>
      </div>

      <AuthScreenCollage mode={mode} />
    </div>
  );
}
