import type { SensitiveFlag } from "./step.js";

/** Input types / autocomplete values we never read .value from. */
export const FORBIDDEN_INPUT_TYPES = [
  "password",
  "email", // still skip values; presence can be flagged
] as const;

export const FORBIDDEN_AUTOCOMPLETE = [
  "cc-number",
  "cc-csc",
  "cc-exp",
  "cc-exp-month",
  "cc-exp-year",
  "cc-name",
  "current-password",
  "new-password",
  "one-time-code",
] as const;

/** URL path fragments that require selective capture / flags. */
export const SENSITIVE_URL_PATTERNS: { re: RegExp; flag: SensitiveFlag }[] = [
  { re: /cashier|deposit|withdraw|payment|billing|wallet/i, flag: "url_looks_cashier" },
  { re: /kyc|verif(y|ication)|document-upload|identity/i, flag: "url_looks_kyc" },
];

export function flagsForUrl(url: string): SensitiveFlag[] {
  const flags: SensitiveFlag[] = [];
  for (const { re, flag } of SENSITIVE_URL_PATTERNS) {
    if (re.test(url)) flags.push(flag);
  }
  return flags;
}

export function isForbiddenInput(el: {
  type?: string | null;
  autocomplete?: string | null;
  name?: string | null;
}): boolean {
  const type = (el.type || "").toLowerCase();
  if (type === "password") return true;
  const ac = (el.autocomplete || "").toLowerCase();
  if (FORBIDDEN_AUTOCOMPLETE.some((v) => ac.includes(v))) return true;
  const name = (el.name || "").toLowerCase();
  if (/(password|cardnumber|cvc|cvv|card-exp)/i.test(name)) return true;
  return false;
}
