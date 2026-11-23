import path from "path";
import { promises as fs } from "fs";
import type { CaptureAnnotation } from "@/lib/admin/types";
import {
  capturesRoot,
  getOperator,
  getSession,
  setArtifactAnnotations,
} from "@/lib/admin/store";
import {
  curatedTagMeta,
  type CuratedTagMeta,
} from "@/lib/library/tag-catalog";
import { readVisionConfig } from "@/lib/prompts/vision";

export type EnrichResult = {
  title: string;
  category: string;
  synonyms: string[];
  confidence: number;
  notes?: string;
  source: "llm" | "curated_fallback";
};

function fallbackEnrich(ann: CaptureAnnotation): EnrichResult {
  const meta: CuratedTagMeta | undefined = curatedTagMeta(ann.tag);
  return {
    title: meta?.title ?? ann.label ?? ann.tag,
    category: meta?.category ?? "Cross",
    synonyms: meta?.synonyms ?? [ann.tag],
    confidence: meta ? 0.7 : 0.4,
    notes: "Curated tag map (no vision key)",
    source: "curated_fallback",
  };
}

async function visionEnrich(opts: {
  stillAbsPath: string;
  tag: string;
  label: string;
  operatorName: string;
}): Promise<EnrichResult | null> {
  const config = readVisionConfig();
  if (!config) return null;

  let b64: string;
  try {
    b64 = (await fs.readFile(opts.stillAbsPath)).toString("base64");
  } catch {
    return null;
  }

  const system = `You label iGaming UI capture stills for the Blaast design research library.
Return JSON only: {"title":"short library card name","category":"Casino|Sports|Cashier|Rewards|Account|Home","synonyms":["search","terms"],"confidence":0.0-1.0,"notes":"one sentence measured vs inferred"}.
Rules: never invent payment credentials or PII; do not copy logos into titles; prefer Casino/Sports/Home for lobbies and carousels.`;

  const user = `Operator: ${opts.operatorName}
Raw tag: ${opts.tag}
Current label: ${opts.label}
Name this UI moment for library search (e.g. Popular slots, Popular sports).`;

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: user },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${b64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[enrich] vision", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      title?: string;
      category?: string;
      synonyms?: string[];
      confidence?: number;
      notes?: string;
    };
    const cat = String(parsed.category ?? "Home");
    const category =
      cat === "Home" || cat === "Cross"
        ? "Cross"
        : ["Casino", "Sports", "Cashier", "Rewards", "Account"].includes(cat)
          ? cat
          : "Cross";
    return {
      title: String(parsed.title || opts.label || opts.tag).slice(0, 80),
      category,
      synonyms: Array.isArray(parsed.synonyms)
        ? parsed.synonyms.map(String).slice(0, 12)
        : [],
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.6,
      notes: parsed.notes ? String(parsed.notes).slice(0, 240) : undefined,
      source: "llm",
    };
  } catch {
    return null;
  }
}

/**
 * Enrich tagged moments: extract stills + optional vision labels.
 * Persists via setArtifactAnnotations (republishes if approved).
 */
export async function enrichSessionAnnotations(
  sessionId: string,
  opts?: { artifactId?: string; forceStills?: boolean },
): Promise<{
  enriched: number;
  stills: number;
  source: "llm" | "curated_fallback" | "mixed";
}> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  const operator = await getOperator(session.operatorId);
  const operatorName = operator?.name ?? "operator";

  const { extractAnnotationStills } = await import(
    "@/lib/admin/poster-from-video"
  );
  const root = capturesRoot();
  const arts = (session.artifacts ?? []).filter((a) =>
    opts?.artifactId ? a.id === opts.artifactId : true,
  );

  let enriched = 0;
  let stills = 0;
  let sawLlm = false;
  let sawFallback = false;

  for (const art of arts) {
    stills += await extractAnnotationStills({
      capturesRoot: root,
      artifact: art,
      force: opts?.forceStills,
    });

    const nextAnns = [...(art.annotations ?? [])];
    for (const ann of nextAnns) {
      if (ann.publishElement === false) continue;
      if (!ann.region && ann.atMs == null && !ann.clipWindow) continue;

      let result: EnrichResult | null = null;
      if (ann.posterPath) {
        result = await visionEnrich({
          stillAbsPath: path.join(root, ann.posterPath),
          tag: ann.tag,
          label: ann.label,
          operatorName,
        });
      }
      if (!result) {
        result = fallbackEnrich(ann);
        sawFallback = true;
      } else {
        sawLlm = true;
      }

      ann.label = result.title;
      ann.searchSynonyms = [
        ...new Set([
          ...(curatedTagMeta(ann.tag)?.synonyms ?? []),
          ...result.synonyms,
        ]),
      ];
      ann.enrichCategory = result.category;
      ann.enrichConfidence = result.confidence;
      ann.enrichedAt = new Date().toISOString();
      if (result.notes) ann.comment = result.notes;
      enriched += 1;
    }

    await setArtifactAnnotations(sessionId, art.id, nextAnns);
  }

  return {
    enriched,
    stills,
    source:
      sawLlm && sawFallback ? "mixed" : sawLlm ? "llm" : "curated_fallback",
  };
}
