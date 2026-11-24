import { promises as fs } from "fs";
import path from "path";

/**
 * CRM / lifecycle emails from the research inbox (Scuup IMAP),
 * mapped onto operator Onboarding flows.
 *
 * Never store OTPs or live verify tokens in published library payloads.
 */

export type ResearchEmailCategory =
  | "verify"
  | "welcome"
  | "bonus"
  | "deposit_nudge"
  | "vip"
  | "reactivation"
  | "other";

export type ResearchEmail = {
  id: string;
  receivedAt: string;
  from: string;
  to: string;
  subject: string;
  category: ResearchEmailCategory;
  snippet: string;
  /** Safe preview image (CDN hero), not a capture still */
  posterUrl?: string;
  /** Sanitized HTML — no scripts; verify tokens stripped */
  html?: string;
  body?: string;
};

export type ResearchEmailPack = {
  operator: string;
  hostname: string;
  researchAlias: string;
  fetchedAt: string;
  emails: ResearchEmail[];
};

const ONBOARDING_CATEGORIES = new Set<ResearchEmailCategory>([
  "verify",
  "welcome",
]);

const TOKENISH =
  /([?&](?:token|code|otp|auth|key|sid|upn)=)[^&\s"'<>]+/gi;
const SENDGRID_CLICK =
  /https?:\/\/[^/\s"'<>]*sendgrid\.net\/ls\/click[^"'<\s]*/gi;

/** Strip verify tokens + click trackers before library publish. */
export function sanitizeEmailForLibrary(
  html: string | null | undefined,
): string | undefined {
  if (!html) return undefined;
  return html
    .replace(TOKENISH, "$1[redacted]")
    .replace(SENDGRID_CLICK, "https://rainbet.com")
    .replace(/\b\d{4,8}\b/g, "••••")
    .slice(0, 80_000);
}

export function emailStepLabel(email: ResearchEmail): string {
  if (email.category === "verify") return "Verify email";
  if (email.category === "welcome") return "Welcome email";
  if (email.category === "bonus") return "Bonus email";
  if (email.category === "deposit_nudge") return "Deposit email";
  if (email.category === "vip") return "VIP email";
  if (email.category === "reactivation") return "Reactivation email";
  return email.subject.slice(0, 48) || "Email";
}

/** Prefer verify/welcome for Onboarding; keep chronological. */
export function onboardingEmails(pack: ResearchEmailPack): ResearchEmail[] {
  return [...pack.emails]
    .filter((e) => ONBOARDING_CATEGORIES.has(e.category))
    .sort(
      (a, b) =>
        new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
    );
}

function packPath(slug: string): string {
  return path.join(
    process.cwd(),
    "data",
    "research-emails",
    `${slug}.json`,
  );
}

function hostToSlug(hostname: string): string {
  return hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\./g, "-")
    .replace(/-com$/, "")
    .replace(/[^a-z0-9-]+/g, "");
}

async function fetchCloudPack(slug: string): Promise<ResearchEmailPack | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url) return null;
  try {
    const res = await fetch(
      `${url}/storage/v1/object/public/blaast-captures/research-emails/${slug}.json?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const pack = (await res.json()) as ResearchEmailPack;
    return pack?.emails?.length ? pack : null;
  } catch {
    return null;
  }
}

async function readLocalPack(slug: string): Promise<ResearchEmailPack | null> {
  try {
    const raw = await fs.readFile(packPath(slug), "utf8");
    const pack = JSON.parse(raw) as ResearchEmailPack;
    return pack?.emails?.length ? pack : null;
  } catch {
    return null;
  }
}

/** Load by operator hostname (rainbet.com → rainbet). */
export async function loadResearchEmailsForHost(
  hostname: string,
): Promise<ResearchEmailPack | null> {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  const slug =
    hostToSlug(host) ||
    host.split(".")[0] ||
    host;
  const candidates = [
    slug,
    host.split(".")[0] ?? "",
    host.replace(/\./g, "-"),
  ].filter(Boolean);

  for (const s of [...new Set(candidates)]) {
    const cloud = await fetchCloudPack(s);
    if (cloud) return cloud;
    const local = await readLocalPack(s);
    if (local) return local;
  }
  return null;
}

export function extractEmailPoster(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const m = html.match(
    /https?:\/\/cdn\.mcauto-images-production\.sendgrid\.net\/[^"'<\s]+\.(?:png|jpe?g|webp)/i,
  );
  return m?.[0]?.replace(/^http:\/\//i, "https://");
}
