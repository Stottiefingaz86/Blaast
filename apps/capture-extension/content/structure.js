/**
 * Content script: builds a measured structure snapshot for the visible page.
 * Never reads password/payment input values.
 */
(() => {
  const MEASURED_STYLE_KEYS = [
    "display",
    "position",
    "color",
    "backgroundColor",
    "backgroundImage",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "borderRadius",
    "borderTopWidth",
    "borderTopColor",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "marginTop",
    "gap",
    "boxShadow",
    "opacity",
    "zIndex",
    "transform",
    "overflow",
  ];

  const MAX_NODES = 120;
  const EXTRACTOR_VERSION = "structure-1.0.0";

  function isForbiddenInput(el) {
    if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) {
      return false;
    }
    const type = (el.type || "").toLowerCase();
    if (type === "password") return true;
    const ac = (el.autocomplete || "").toLowerCase();
    if (
      [
        "cc-number",
        "cc-csc",
        "cc-exp",
        "cc-exp-month",
        "cc-exp-year",
        "cc-name",
        "current-password",
        "new-password",
        "one-time-code",
      ].some((v) => ac.includes(v))
    ) {
      return true;
    }
    const name = (el.name || "").toLowerCase();
    return /(password|cardnumber|cvc|cvv|card-exp)/i.test(name);
  }

  function flagsForUrl(url) {
    const flags = [];
    if (/cashier|deposit|withdraw|payment|billing|wallet/i.test(url)) {
      flags.push("url_looks_cashier");
    }
    if (/kyc|verif(y|ication)|document-upload|identity/i.test(url)) {
      flags.push("url_looks_kyc");
    }
    return flags;
  }

  function scanSensitiveFlags() {
    const flags = new Set(flagsForUrl(location.href));
    document.querySelectorAll("input, textarea").forEach((el) => {
      if (!isForbiddenInput(el)) return;
      if ((el.type || "").toLowerCase() === "password") flags.add("password_field_present");
      const ac = (el.autocomplete || "").toLowerCase();
      if (ac.includes("cc-") || /card|cvc|cvv/i.test(el.name || "")) {
        flags.add("payment_field_present");
      }
      if (ac.includes("one-time-code")) flags.add("otp_field_present");
    });
    if (flags.has("password_field_present") || flags.has("payment_field_present")) {
      flags.add("manual_redact_required");
    }
    return [...flags];
  }

  function cssVariables() {
    const styles = getComputedStyle(document.documentElement);
    const out = [];
    for (let i = 0; i < styles.length; i++) {
      const name = styles[i];
      if (!name.startsWith("--")) continue;
      const raw = styles.getPropertyValue(name).trim();
      if (!raw) continue;
      out.push({
        name,
        value: { value: raw, provenance: "measured" },
        source: "documentElement",
      });
      if (out.length >= 200) break;
    }
    return out;
  }

  function selectorHint(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id && /^[a-zA-Z][\w-]*$/.test(el.id) ? `#${el.id}` : "";
    const cls = (el.classList && el.classList[0]) || "";
    const clsPart = cls && /^[a-zA-Z][\w-]*$/.test(cls) ? `.${cls}` : "";
    return `${tag}${id}${clsPart}`;
  }

  function textPreview(el) {
    if (isForbiddenInput(el)) return undefined;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return undefined;
    }
    const t = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    if (!t) return undefined;
    return t.slice(0, 80);
  }

  function measuredStyles(el) {
    const cs = getComputedStyle(el);
    const styles = {};
    for (const key of MEASURED_STYLE_KEYS) {
      const v = cs[key];
      if (v) styles[key] = v;
    }
    return styles;
  }

  function hasCanvasOrWebgl() {
    return Boolean(document.querySelector("canvas"));
  }

  /** Measured CSS / WAAPI motion — Mobbin-grade agent handoff for loaders, etc. */
  function collectMotion() {
    const animations = [];
    try {
      if (typeof document.getAnimations === "function") {
        const list = document.getAnimations({ subtree: true });
        for (const anim of list) {
          if (animations.length >= 40) break;
          const effect = anim.effect;
          let durationMs;
          let delayMs;
          let easing;
          let iterations;
          let targetHint;
          if (effect && typeof effect.getTiming === "function") {
            const t = effect.getTiming();
            durationMs =
              typeof t.duration === "number" ? t.duration : undefined;
            delayMs = typeof t.delay === "number" ? t.delay : undefined;
            easing = t.easing;
            iterations =
              t.iterations === Infinity ? "infinite" : String(t.iterations ?? 1);
          }
          if (effect && effect.target instanceof Element) {
            targetHint = selectorHint(effect.target);
          }
          const name =
            (anim instanceof CSSAnimation && anim.animationName) ||
            (anim instanceof CSSTransition && anim.transitionProperty) ||
            anim.id ||
            "unnamed";
          animations.push({
            targetHint,
            name: { value: String(name), provenance: "measured" },
            durationMs:
              durationMs != null
                ? { value: durationMs, provenance: "measured" }
                : undefined,
            delayMs:
              delayMs != null
                ? { value: delayMs, provenance: "measured" }
                : undefined,
            easing: easing
              ? { value: String(easing), provenance: "measured" }
              : undefined,
            iterationCount: iterations
              ? { value: iterations, provenance: "measured" }
              : undefined,
            source:
              anim instanceof CSSTransition
                ? "css_transition"
                : anim instanceof CSSAnimation
                  ? "css_animation"
                  : "web_animations_api",
            playState: anim.playState,
          });
        }
      }
    } catch {
      /* ignore */
    }

    // Fallback: scan computed animationName on interactive / loading-ish nodes
    if (animations.length === 0) {
      const els = document.querySelectorAll(
        "[class*='load' i], [class*='spin' i], [class*='skeleton' i], [class*='shimmer' i], [class*='pulse' i], [aria-busy='true']",
      );
      for (const el of els) {
        if (!(el instanceof HTMLElement)) continue;
        if (animations.length >= 20) break;
        const cs = getComputedStyle(el);
        const animName = cs.animationName;
        if (!animName || animName === "none") continue;
        animations.push({
          targetHint: selectorHint(el),
          name: { value: animName, provenance: "measured" },
          durationMs: {
            value: parseFloat(cs.animationDuration) * 1000 || 0,
            provenance: "measured",
          },
          easing: {
            value: cs.animationTimingFunction,
            provenance: "measured",
          },
          iterationCount: {
            value: cs.animationIterationCount,
            provenance: "measured",
          },
          source: "css_animation",
          playState: "running",
        });
      }
    }

    return {
      extractorVersion: "motion-1.0.0",
      canvasOrWebglDetected: hasCanvasOrWebgl(),
      animations,
    };
  }

  function collectNodes() {
    const candidates = document.querySelectorAll(
      "header, nav, footer, main, [role='navigation'], [role='main'], [role='dialog'], button, a, h1, h2, h3, [class*='betslip' i], [class*='lobby' i], [data-testid]",
    );
    const nodes = [];
    const seen = new Set();
    for (const el of candidates) {
      if (!(el instanceof HTMLElement)) continue;
      if (isForbiddenInput(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      if (rect.bottom < 0 || rect.right < 0 || rect.top > innerHeight || rect.left > innerWidth) {
        continue;
      }
      const hint = selectorHint(el);
      const key = `${hint}:${Math.round(rect.x)}:${Math.round(rect.y)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      nodes.push({
        nodeId: `n${nodes.length}`,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role") || undefined,
        selectorHint: hint,
        textPreview: textPreview(el),
        box: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        styles: measuredStyles(el),
      });
      if (nodes.length >= MAX_NODES) break;
    }
    return nodes;
  }

  function buildSnapshot() {
    const canvas = hasCanvasOrWebgl();
    const motion = collectMotion();
    return {
      capturedAt: new Date().toISOString(),
      documentTitle: document.title,
      cssVariables: cssVariables(),
      nodes: collectNodes(),
      motion,
      stylesAvailability: canvas ? "mixed" : "dom",
      extractorVersion: EXTRACTOR_VERSION,
      canvasOrWebglDetected: canvas,
      sensitiveFlags: scanSensitiveFlags(),
      page: { url: location.href, title: document.title },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        scrollX: Math.round(window.scrollX),
        scrollY: Math.round(window.scrollY),
      },
    };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "BLAAST_CAPTURE_STRUCTURE") {
      try {
        sendResponse({ ok: true, snapshot: buildSnapshot() });
      } catch (err) {
        sendResponse({ ok: false, error: String(err?.message || err) });
      }
      return true;
    }
    return false;
  });
})();
