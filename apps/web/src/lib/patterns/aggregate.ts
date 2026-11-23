import { promises as fs } from "fs";
import path from "path";
import { listOperators } from "@/lib/admin/store";
import { listPublishedClips } from "@/lib/evidence/publish";
import { extractOperatorFingerprints } from "@/lib/patterns/fingerprint";
import {
  PATTERN_EXTRACTOR_VERSION,
  type PatternAggregate,
  type PatternFingerprint,
  type PatternIndex,
  type PatternKind,
} from "@/lib/patterns/types";
import type { OperatorVertical } from "@/lib/admin/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const INDEX_PATH = path.join(DATA_DIR, "pattern-index.json");

export async function readPatternIndex(): Promise<PatternIndex> {
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf8");
    return JSON.parse(raw) as PatternIndex;
  } catch {
    return {
      version: PATTERN_EXTRACTOR_VERSION,
      updatedAt: new Date(0).toISOString(),
      fingerprints: [],
      aggregates: [],
    };
  }
}

async function writePatternIndex(index: PatternIndex) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(INDEX_PATH, JSON.stringify(index, null, 2), "utf8");
}

function rollup(fingerprints: PatternFingerprint[]): PatternAggregate[] {
  const map = new Map<string, PatternAggregate>();
  for (const fp of fingerprints) {
    const existing = map.get(fp.normalizedKey);
    if (!existing) {
      map.set(fp.normalizedKey, {
        normalizedKey: fp.normalizedKey,
        kind: fp.kind,
        label: fp.label.split(" (")[0] ?? fp.label,
        countOperators: 1,
        operatorSlugs: [fp.operatorSlug],
        evidenceSamples: fp.evidenceIds.slice(0, 5),
        segmentBreakdown: {
          [fp.vertical ?? "unknown"]: 1,
        },
        journey: fp.journey ? String(fp.journey) : undefined,
      });
      continue;
    }
    if (!existing.operatorSlugs.includes(fp.operatorSlug)) {
      existing.countOperators += 1;
      existing.operatorSlugs.push(fp.operatorSlug);
      const seg = (fp.vertical ?? "unknown") as OperatorVertical | "unknown";
      existing.segmentBreakdown[seg] =
        (existing.segmentBreakdown[seg] ?? 0) + 1;
    }
    for (const id of fp.evidenceIds) {
      if (existing.evidenceSamples.length >= 8) break;
      if (!existing.evidenceSamples.includes(id)) {
        existing.evidenceSamples.push(id);
      }
    }
  }
  return [...map.values()].sort(
    (a, b) => b.countOperators - a.countOperators || a.normalizedKey.localeCompare(b.normalizedKey),
  );
}

/** Full rebuild of pattern-index.json from operators + published clips. */
export async function rebuildPatternIndex(): Promise<PatternIndex> {
  const [operators, clips] = await Promise.all([
    listOperators(),
    listPublishedClips(),
  ]);
  const fingerprints: PatternFingerprint[] = [];
  for (const op of operators) {
    fingerprints.push(...extractOperatorFingerprints(op, clips));
  }
  const index: PatternIndex = {
    version: PATTERN_EXTRACTOR_VERSION,
    updatedAt: new Date().toISOString(),
    fingerprints,
    aggregates: rollup(fingerprints),
  };
  await writePatternIndex(index);
  return index;
}

export type PatternQuery = {
  kind?: PatternKind;
  journey?: string;
  vertical?: OperatorVertical | string;
  region?: string;
  query?: string;
  limit?: number;
};

export async function listPatterns(opts: PatternQuery = {}) {
  const index = await readPatternIndex();
  let list = [...index.aggregates];
  if (opts.kind) list = list.filter((a) => a.kind === opts.kind);
  if (opts.journey) {
    const j = opts.journey.toLowerCase();
    list = list.filter((a) => (a.journey ?? "").toLowerCase().includes(j));
  }
  if (opts.vertical) {
    const v = opts.vertical;
    list = list.filter((a) => (a.segmentBreakdown[v as OperatorVertical] ?? 0) > 0);
  }
  if (opts.query) {
    const q = opts.query.toLowerCase();
    list = list.filter(
      (a) =>
        a.normalizedKey.toLowerCase().includes(q) ||
        a.label.toLowerCase().includes(q),
    );
  }
  if (opts.region) {
    const r = opts.region.toLowerCase();
    const slugs = new Set(
      index.fingerprints
        .filter((f) =>
          (f.regions ?? []).some((x) => x.toLowerCase() === r),
        )
        .map((f) => f.operatorSlug),
    );
    list = list.filter((a) => a.operatorSlugs.some((s) => slugs.has(s)));
  }
  return list.slice(0, opts.limit ?? 40);
}

export async function mostUsedPattern(opts: PatternQuery = {}) {
  const list = await listPatterns({ ...opts, limit: 1 });
  const top = list[0];
  if (!top) return null;
  const index = await readPatternIndex();
  const examples = index.fingerprints.filter(
    (f) => f.normalizedKey === top.normalizedKey,
  );
  return {
    aggregate: top,
    examples,
    provenance: "measured" as const,
    note: "Ranked by count of distinct operators sharing this fingerprint in the Blaast corpus.",
  };
}

export async function getPattern(normalizedKey: string) {
  const index = await readPatternIndex();
  const aggregate = index.aggregates.find((a) => a.normalizedKey === normalizedKey);
  const fingerprints = index.fingerprints.filter(
    (f) => f.normalizedKey === normalizedKey,
  );
  if (!aggregate && !fingerprints.length) return null;
  return {
    aggregate: aggregate ?? null,
    fingerprints,
    provenance: "measured" as const,
  };
}

export async function compareOperators(opts: {
  slugs: string[];
  kind?: PatternKind;
  journey?: string;
}) {
  const index = await readPatternIndex();
  const slugs = opts.slugs.map((s) => s.replace(/\./g, "-"));
  const bySlug: Record<string, PatternFingerprint[]> = {};
  for (const slug of slugs) {
    bySlug[slug] = index.fingerprints.filter((f) => {
      if (f.operatorSlug !== slug && f.operatorHostname.replace(/\./g, "-") !== slug) {
        return false;
      }
      if (opts.kind && f.kind !== opts.kind) return false;
      if (opts.journey && String(f.journey ?? "").toLowerCase() !== opts.journey.toLowerCase()) {
        return false;
      }
      return true;
    });
  }
  return {
    operators: slugs,
    bySlug,
    provenance: "measured" as const,
  };
}

export async function notableFlows(opts: {
  journey?: string;
  vertical?: string;
  limit?: number;
}) {
  const operators = await listOperators();
  const notable = operators.filter(
    (o) => o.referenceTier === "notable" || o.referenceTier === "core",
  );
  const index = await readPatternIndex();
  const notableSlugs = new Set(
    notable.map((o) => o.hostname.replace(/\./g, "-")),
  );
  let flows = index.fingerprints.filter(
    (f) =>
      f.kind === "flow" &&
      (notableSlugs.has(f.operatorSlug) ||
        notable.some((o) => o.hostname === f.operatorHostname)),
  );
  if (opts.journey) {
    const j = opts.journey.toLowerCase();
    flows = flows.filter(
      (f) =>
        String(f.journey ?? "").toLowerCase().includes(j) ||
        f.normalizedKey.toLowerCase().includes(j),
    );
  }
  if (opts.vertical) {
    flows = flows.filter((f) => f.vertical === opts.vertical);
  }
  return {
    results: flows.slice(0, opts.limit ?? 20),
    count: Math.min(flows.length, opts.limit ?? 20),
    referenceOperators: notable.map((o) => ({
      slug: o.hostname.replace(/\./g, "-"),
      name: o.name,
      tier: o.referenceTier,
      vertical: o.vertical,
    })),
    provenance: "measured" as const,
    note: "“Best / notable” = curated referenceTier operators, not external traffic rankings.",
  };
}
