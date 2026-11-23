import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { catalogFromPublished } from "@/lib/library/published-catalog";
import type { CatalogOperator } from "@/lib/library/catalog";

export const dynamic = "force-dynamic";

type CoverSlot = {
  label: string;
  posterUrl?: string;
  videoUrl?: string;
  operatorName?: string;
  operatorSlug?: string;
  /** Capture form factor — lander must frame web vs mobile correctly */
  platform: "mobile" | "web";
  mediaKey: string;
};

function mediaKey(poster?: string, video?: string) {
  // Strip cache-bust query so same clip isn't treated as different
  const norm = (u?: string) => (u ?? "").replace(/([?&])t=\d+/g, "").split("&ann=")[0];
  return `${norm(video)}|${norm(poster)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Every distinct screen / UI clip across operators — one entry per unique video. */
function collectUniqueMedia(operators: CatalogOperator[]): CoverSlot[] {
  const seen = new Set<string>();
  const out: CoverSlot[] = [];

  const push = (
    label: string,
    op: CatalogOperator,
    posterUrl?: string,
    videoUrl?: string,
  ) => {
    if (!posterUrl && !videoUrl) return;
    const key = mediaKey(posterUrl, videoUrl);
    if (!key || key === "|" || seen.has(key)) return;
    seen.add(key);
    out.push({
      label,
      posterUrl,
      videoUrl,
      operatorName: op.name,
      operatorSlug: op.slug,
      platform: op.platform,
      mediaKey: key,
    });
  };

  for (const op of operators) {
    for (const s of op.screens) {
      push(s.title, op, s.posterUrl, s.videoUrl);
    }
    for (const u of op.uiElements) {
      push(u.name, op, u.posterUrl, u.videoUrl);
    }
    for (const f of op.flows) {
      for (const step of f.steps) {
        push(step.label || f.name, op, step.posterUrl, step.videoUrl);
      }
    }
  }

  return out;
}

const LOGIN_PREFS = [
  { label: "Sportsbook", match: /home|event|betslip|sport|odds/i },
  { label: "Casino", match: /casino|lobby|game|slot|provider/i },
  { label: "Cashier", match: /deposit|cashier|withdraw|payment/i },
  { label: "VIP", match: /vip|reward|loyalty|promo|header/i },
] as const;

const SIGNUP_PREFS = [
  { label: "Sign up", match: /login|register|sign|onboard|welcome/i },
  { label: "Login", match: /login|sign in|account|header/i },
  { label: "Onboarding", match: /onboard|kyc|verify|welcome|home/i },
  { label: "Home", match: /home|landing/i },
] as const;

function pickUniqueForSlots(
  pool: CoverSlot[],
  prefs: readonly { label: string; match: RegExp }[],
): CoverSlot[] {
  const remaining = [...pool];
  const used = new Set<string>();
  const result: CoverSlot[] = [];

  for (const pref of prefs) {
    const idx = remaining.findIndex(
      (c) =>
        !used.has(c.mediaKey) &&
        pref.match.test(`${c.label} ${c.operatorName ?? ""}`),
    );
    if (idx >= 0) {
      const hit = remaining.splice(idx, 1)[0]!;
      used.add(hit.mediaKey);
      result.push({ ...hit, label: pref.label });
      continue;
    }
    // Next unused distinct clip (any label)
    const any = remaining.find((c) => !used.has(c.mediaKey));
    if (any) {
      used.add(any.mediaKey);
      remaining.splice(remaining.indexOf(any), 1);
      result.push({ ...any, label: pref.label });
    }
  }

  return result;
}

export async function GET(req: NextRequest) {
  const mode =
    req.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
  const platformFilter = req.nextUrl.searchParams.get("platform");
  const limit = Math.min(
    40,
    Math.max(4, Number(req.nextUrl.searchParams.get("limit") ?? "12") || 12),
  );
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;

  const operators = await catalogFromPublished(origin);
  let all = collectUniqueMedia(operators);
  if (platformFilter === "mobile" || platformFilter === "web") {
    const filtered = all.filter((c) => c.platform === platformFilter);
    if (filtered.length >= 3) all = filtered;
  }
  // Prefer clips that have video so the auth wall can loop motion
  const withVideo = all.filter((c) => Boolean(c.videoUrl));
  const pool = shuffle(withVideo.length >= 8 ? withVideo : all);
  const prefs = mode === "signup" ? SIGNUP_PREFS : LOGIN_PREFS;

  // Slot-labelled covers (login/signup collage) — always unique media
  const slotted = pickUniqueForSlots(pool, prefs);

  // Extra unique clips for the lander rail (no duplicates)
  const usedKeys = new Set(slotted.map((c) => c.mediaKey));
  const extras = pool.filter((c) => !usedKeys.has(c.mediaKey));
  const covers = [...slotted, ...extras].slice(0, limit);

  return NextResponse.json({
    mode,
    covers,
    uniqueCount: pool.length,
  });
}
