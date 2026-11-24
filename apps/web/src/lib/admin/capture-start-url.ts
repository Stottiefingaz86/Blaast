/**
 * URL opened when Record / Open site runs.
 * Some brands (bet365) geo+language-redirect naked domains — prefer market-aware entry.
 */

export function captureStartUrl(
  operator: { url: string; hostname?: string },
  market?: string | null,
): string {
  const raw = (operator.url || "").trim();
  if (!raw) return raw;
  let host = (operator.hostname || "").toLowerCase().replace(/^www\./, "");
  try {
    if (!host) host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    /* keep host */
  }
  const m = (market || "").toUpperCase().trim();

  // bet365: naked bet365.com follows Accept-Language → ES if Chrome is Spanish.
  // UK capture: always www + English sports home hash.
  if (host === "bet365.com" || host === "bet365.es") {
    if (m === "ES" || m === "MX" || m === "AR" || m === "CL" || m === "PE") {
      return "https://www.bet365.es/#/HO/";
    }
    if (m === "IT") return "https://www.bet365.it/#/HO/";
    if (m === "DE" || m === "AT") return "https://www.bet365.de/#/HO/";
    if (m === "GR") return "https://www.bet365.gr/#/HO/";
    // UK / AU / CA / default research English
    return "https://www.bet365.com/#/HO/";
  }

  return raw;
}
