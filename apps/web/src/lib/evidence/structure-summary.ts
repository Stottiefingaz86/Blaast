import type { MotionHintSummary, StructureRegion } from "./types";

type RawNode = {
  nodeId?: string;
  tag?: string;
  role?: string;
  selectorHint?: string;
  textPreview?: string;
  box?: { x: number; y: number; width: number; height: number };
  styles?: Record<string, string>;
};

type RawMotionAnim = {
  targetHint?: string;
  name?: { value?: string };
  durationMs?: { value?: number };
  easing?: { value?: string };
  iterationCount?: { value?: string };
  source?: string;
};

type StructureSnapshot = {
  nodes?: RawNode[];
  motion?: { animations?: RawMotionAnim[] };
  cssVariables?: { name: string; value: { value: string } }[];
  viewport?: { width: number; height: number };
  page?: { url?: string; title?: string };
};

/** Pick the most useful measured regions for agent prompts (not the full tree). */
export function summarizeStructure(
  snap: unknown,
  limit = 24,
): {
  regions: StructureRegion[];
  motionHints: MotionHintSummary[];
  tokenHints: string[];
  pageUrl?: string;
} {
  const s = (snap || {}) as StructureSnapshot;
  const nodes = Array.isArray(s.nodes) ? s.nodes : [];

  const scored = nodes
    .filter((n) => n.box && n.selectorHint)
    .map((n) => {
      const area = (n.box!.width || 0) * (n.box!.height || 0);
      const role = (n.role || n.tag || "region").toLowerCase();
      const boost =
        /header|nav|main|dialog|betslip|lobby|button/.test(
          `${role} ${n.selectorHint}`,
        )
          ? 2
          : 1;
      return { n, score: area * boost };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const regions: StructureRegion[] = scored.map(({ n }) => ({
    role: n.role || n.tag || "region",
    selectorHint: n.selectorHint!,
    box: n.box!,
    textPreview: n.textPreview,
    styles: pickStyles(n.styles),
  }));

  const motionHints: MotionHintSummary[] = (s.motion?.animations || [])
    .slice(0, 20)
    .map((a) => ({
      name: a.name?.value || "unnamed",
      durationMs: a.durationMs?.value,
      easing: a.easing?.value,
      iterationCount: a.iterationCount?.value,
      source: a.source || "css_animation",
      targetHint: a.targetHint,
    }));

  const tokenHints = (s.cssVariables || [])
    .slice(0, 30)
    .map((v) => `${v.name}: ${v.value?.value ?? ""}`);

  return {
    regions,
    motionHints,
    tokenHints,
    pageUrl: s.page?.url,
  };
}

function pickStyles(styles?: Record<string, string>) {
  if (!styles) return undefined;
  const keys = [
    "display",
    "position",
    "fontSize",
    "fontWeight",
    "color",
    "backgroundColor",
    "borderRadius",
    "gap",
    "paddingTop",
    "paddingLeft",
  ];
  const out: Record<string, string> = {};
  for (const k of keys) {
    if (styles[k]) out[k] = styles[k]!;
  }
  return Object.keys(out).length ? out : undefined;
}
