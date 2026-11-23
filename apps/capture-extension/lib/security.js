/** Mirrors packages/capture-schema security helpers (plain JS for unpacked load). */

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
];

export const SENSITIVE_URL_PATTERNS = [
  { re: /cashier|deposit|withdraw|payment|billing|wallet/i, flag: "url_looks_cashier" },
  { re: /kyc|verif(y|ication)|document-upload|identity/i, flag: "url_looks_kyc" },
];

export function flagsForUrl(url) {
  const flags = [];
  for (const { re, flag } of SENSITIVE_URL_PATTERNS) {
    if (re.test(url)) flags.push(flag);
  }
  return flags;
}

export function isForbiddenInput(el) {
  const type = (el.type || "").toLowerCase();
  if (type === "password") return true;
  const ac = (el.autocomplete || "").toLowerCase();
  if (FORBIDDEN_AUTOCOMPLETE.some((v) => ac.includes(v))) return true;
  const name = (el.name || "").toLowerCase();
  if (/(password|cardnumber|cvc|cvv|card-exp)/i.test(name)) return true;
  return false;
}

export function scanDomSensitiveFlags(doc) {
  const flags = new Set();
  const inputs = doc.querySelectorAll("input, textarea");
  for (const el of inputs) {
    if (isForbiddenInput(el)) {
      if ((el.type || "").toLowerCase() === "password") flags.add("password_field_present");
      const ac = (el.autocomplete || "").toLowerCase();
      if (ac.includes("cc-") || /card|cvc|cvv/i.test(el.name || "")) {
        flags.add("payment_field_present");
      }
      if (ac.includes("one-time-code")) flags.add("otp_field_present");
    }
  }
  return [...flags];
}
