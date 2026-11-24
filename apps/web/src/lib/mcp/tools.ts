import {
  getOperatorPublishedSummary,
  getPublishedEvidenceById,
  resolveFlowEvidence,
  searchPublishedEvidence,
} from "@/lib/evidence/index";
import { generateReplicatePrompt } from "@/lib/prompts/generate";
import {
  compareOperators,
  getPattern,
  listPatterns,
  mostUsedPattern,
  notableFlows,
} from "@/lib/patterns/aggregate";
import type { PatternKind } from "@/lib/patterns/types";

/**
 * Blaast MCP tools — reviewed captures only (no demo catalog).
 * Agents get tags + region boxes + clip windows + media URLs.
 */
export const MCP_TOOLS = [
  {
    name: "search_screens",
    description:
      "Search operator UI screens / coverage beats by product, market, journey, or pattern (betslip, deposit, lobby, loader, etc.). Prefers reviewed captures with structure.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search" },
        platform: {
          type: "string",
          enum: ["mobile", "web", "any"],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "search_flows",
    description:
      "Search ordered multi-step flows (onboarding, first deposit, place a bet, cash out).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        platform: { type: "string", enum: ["mobile", "web", "any"] },
      },
      required: ["query"],
    },
  },
  {
    name: "search_ui",
    description:
      "Search UI elements by tag (loader, skeleton, odds_button, side_nav, search, …). Returns media + structure flags.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        platform: { type: "string", enum: ["mobile", "web", "any"] },
      },
      required: ["query"],
    },
  },
  {
    name: "get_motion",
    description:
      "Find loader / skeleton / spinner / animated UI with measured motion hints and clip URLs when available.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "e.g. loader, skeleton, shimmer, casino lobby",
        },
        platform: { type: "string", enum: ["mobile", "web", "any"] },
      },
      required: ["query"],
    },
  },
  {
    name: "get_evidence",
    description:
      "Load full evidence for an evidence_id or flow_id: steps, measured regions, motion, media URLs, agent replicate prompt.",
    inputSchema: {
      type: "object",
      properties: {
        evidence_id: { type: "string" },
        flow_id: { type: "string" },
      },
    },
  },
  {
    name: "get_flow",
    description:
      "Load a full flow with ordered steps and an agent replicate prompt (reviewed capture preferred).",
    inputSchema: {
      type: "object",
      properties: {
        flow_id: { type: "string" },
      },
      required: ["flow_id"],
    },
  },
  {
    name: "get_operator",
    description:
      "Operator profile with published capture beats and/or demo catalog screens.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_collections",
    description: "List workspace collections (stub counts until library publish UI lands).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_patterns",
    description:
      "List cross-operator UX pattern fingerprints (homepage IA, lobby structure, flows, UI elements). Filter by kind, journey, vertical, region, or query.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["flow", "ui_element", "homepage_ia"],
        },
        journey: { type: "string", description: "e.g. casino, landing, onboarding" },
        vertical: {
          type: "string",
          description: "crypto_casino | traditional_sportsbook | hybrid | other",
        },
        region: { type: "string" },
        query: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "most_used_pattern",
    description:
      "Highest-frequency pattern in the Blaast corpus (e.g. casino-first homepage, lobby structure). Ranked by distinct operators sharing the fingerprint.",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["flow", "ui_element", "homepage_ia"],
        },
        journey: { type: "string" },
        vertical: { type: "string" },
        query: {
          type: "string",
          description: "e.g. lobby, homepage, onboarding",
        },
      },
    },
  },
  {
    name: "get_pattern",
    description:
      "Full detail for one normalized pattern key: aggregate + per-operator fingerprints with evidence IDs.",
    inputSchema: {
      type: "object",
      properties: {
        normalized_key: {
          type: "string",
          description: "e.g. homepage.casino_first",
        },
      },
      required: ["normalized_key"],
    },
  },
  {
    name: "compare_operators",
    description:
      "Side-by-side pattern fingerprints for 2+ operators (slugs) on a journey or kind.",
    inputSchema: {
      type: "object",
      properties: {
        slugs: {
          type: "array",
          items: { type: "string" },
          description: "Operator slugs e.g. rainbet-com",
        },
        kind: {
          type: "string",
          enum: ["flow", "ui_element", "homepage_ia"],
        },
        journey: { type: "string" },
      },
      required: ["slugs"],
    },
  },
  {
    name: "notable_flows",
    description:
      "Flows from curated reference-tier operators (stand-in for “best / top” shortlists). Filter by journey or vertical.",
    inputSchema: {
      type: "object",
      properties: {
        journey: {
          type: "string",
          description: "e.g. onboarding, casino, sports_betslip",
        },
        vertical: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
] as const;

function matchQuery(hay: string, q: string) {
  const parts = q.toLowerCase().split(/\s+/).filter(Boolean);
  const h = hay.toLowerCase();
  return parts.every((p) => h.includes(p));
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
  origin: string,
) {
  const query = String(args.query ?? "");
  const platform = String(args.platform ?? "any");

  if (name === "search_screens") {
    const published = await searchPublishedEvidence({
      query,
      origin,
      platform,
      limit: 20,
    });
    return {
      source: published.length ? "reviewed_captures" : "empty",
      results: published,
      count: published.length,
      hint: published.length
        ? undefined
        : "No reviewed captures yet. Capture + Approve in /admin — demo catalog is disabled.",
    };
  }

  if (name === "search_ui") {
    const published = await searchPublishedEvidence({
      query,
      origin,
      platform,
      kind: "ui_element",
      limit: 20,
    });
    // Also include any beat whose tags match even if taxonomy isn't ui_element
    const tagged = await searchPublishedEvidence({
      query,
      origin,
      platform,
      limit: 20,
    });
    const merged = [...published];
    for (const h of tagged) {
      if (!merged.some((m) => m.id === h.id)) merged.push(h);
    }
    return {
      source: merged.length ? "reviewed_captures" : "empty",
      results: merged.slice(0, 20),
      count: Math.min(merged.length, 20),
      hint: merged.length
        ? undefined
        : "No reviewed UI captures yet. Run brand coverage in /admin and Approve loader/skeleton/nav beats.",
    };
  }

  if (name === "get_motion") {
    const motionQuery = query || "loader skeleton spinner shimmer";
    const published = await searchPublishedEvidence({
      query: motionQuery,
      origin,
      platform,
      motionOnly: true,
      limit: 20,
    });
    return {
      source: published.length ? "reviewed_captures" : "empty",
      results: published,
      count: published.length,
      agent_note:
        "Use get_evidence on a hit to load measured motion timings + structure regions. Implement with customer tokens; match duration/easing when measured.",
      hint: published.length
        ? undefined
        : "Capture ui-loader / ui-skeleton coverage beats, Approve them, then retry.",
    };
  }

  if (name === "search_flows") {
    const published = await searchPublishedEvidence({
      query,
      origin,
      platform,
      limit: 20,
    });
    const flowish = published.filter(
      (h) => h.kind === "flow_beat" || Boolean(h.flowId),
    );
    return {
      source: flowish.length ? "reviewed_captures" : "empty",
      results: flowish,
      count: flowish.length,
      hint: flowish.length
        ? undefined
        : "No reviewed flow captures yet. Capture + Approve in /admin — demo catalog is disabled.",
    };
  }

  if (name === "get_evidence") {
    const evidenceId = String(args.evidence_id ?? "");
    const flowId = String(args.flow_id ?? "");
    let evidence = evidenceId
      ? await getPublishedEvidenceById(evidenceId, origin)
      : null;
    if (!evidence && flowId) {
      evidence = await resolveFlowEvidence(flowId, origin);
    }
    if (!evidence) {
      return {
        error: "Evidence not found",
        hint: "Pass evidence_id from search_* or a flow_id from get_flow / search_flows.",
      };
    }
    const generated = await generateReplicatePrompt({
      flowId: evidence.flowId,
      origin,
      preferTemplate: true,
    }).catch(() => null);

    return {
      evidence,
      agent_prompt: generated?.prompt ?? null,
      prompt_source: generated?.source ?? null,
      citations: generated?.citations ?? [],
    };
  }

  if (name === "get_flow") {
    const id = String(args.flow_id ?? "");
    const evidence = await resolveFlowEvidence(id, origin);
    if (evidence && evidence.confidence !== "demo") {
      const generated = await generateReplicatePrompt({
        flowId: evidence.flowId,
        origin,
        preferTemplate: true,
      });
      return {
        source: "reviewed_captures",
        operator: evidence.operatorName,
        flow_id: evidence.flowId,
        name: evidence.flowName,
        group: evidence.group,
        tags: evidence.tags,
        actions: evidence.actions,
        steps: evidence.steps.map((s) => ({
          id: s.stepId,
          label: s.label,
          kind: s.surfaceKind,
          tags: s.tags,
          has_structure: Boolean(s.structureRegions?.length),
          has_motion: Boolean(s.motionHints?.length),
          media: s.artifacts.filter((a) => a.url),
        })),
        url: `${origin}${evidence.libraryPath}`,
        agent_prompt: generated.prompt,
        prompt_source: generated.source,
        evidence_id: evidence.evidenceId,
        citations: generated.citations,
      };
    }

    // Library catalog flows (e.g. whale-io-brand-journey)
    const { getPublishedFlow } = await import("@/lib/library/published-catalog");
    const lib = await getPublishedFlow(id, origin);
    if (lib) {
      const { operator, flow } = lib;
      return {
        source: "published_catalog",
        operator: operator.name,
        flow_id: flow.id,
        name: flow.name,
        group: flow.group,
        tags: [],
        actions: flow.actions,
        steps: flow.steps.map((s) => ({
          id: s.id,
          label: s.label,
          kind: s.kind,
          evidence_id: s.evidenceId,
          has_structure: Boolean(s.region),
          has_motion: Boolean(s.videoUrl),
          media: [
            s.posterUrl ? { kind: "poster", url: s.posterUrl } : null,
            s.videoUrl ? { kind: "video", url: s.videoUrl } : null,
          ].filter(Boolean),
          clipWindow: s.clipWindow,
        })),
        url: `${origin}/operators/${operator.slug}?tab=flows&flow=${encodeURIComponent(flow.id)}`,
        agent_prompt: null,
        prompt_source: null,
        evidence_id: flow.steps.find((s) => s.evidenceId)?.evidenceId ?? null,
        citations: [],
      };
    }

    return {
      error: `Unknown flow_id: ${id}`,
      hint: "Use search_flows / get_operator.flows, or a brand-journey id like whale-io-brand-journey.",
    };
  }

  if (name === "get_operator") {
    const slug = String(args.slug ?? "");
    const published = await getOperatorPublishedSummary(slug, origin);
    const { getPublishedOperator } = await import(
      "@/lib/library/published-catalog"
    );
    const op = await getPublishedOperator(slug, origin);
    // Also match hostname-style slugs from MCP (rainbet.com → rainbet-com)
    const byHost =
      op ??
      (await getPublishedOperator(slug.replace(/\./g, "-"), origin));
    if (!byHost && !published.published_count) {
      return { error: `Unknown operator: ${slug}` };
    }
    const catalogBeats =
      (byHost?.screens.length ?? 0) + (byHost?.uiElements.length ?? 0);
    return {
      slug: byHost?.slug ?? slug,
      name: byHost?.name ?? published.beats[0]?.operator ?? slug,
      logo_url: byHost?.logoUrl,
      // Prefer evidence-index count; fall back to catalog screen+UI counts
      published_captures: published.published_count || catalogBeats,
      published_beats: published.beats,
      screens: byHost?.screens ?? [],
      ui_elements: byHost?.uiElements ?? [],
      flows: (byHost?.flows ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        group: f.group,
        steps: f.steps.length,
      })),
      emails: byHost?.emails?.length ?? 0,
      url: byHost ? `${origin}/operators/${byHost.slug}` : undefined,
    };
  }

  if (name === "list_collections") {
    const published = await searchPublishedEvidence({
      query: "",
      origin,
      limit: 100,
    });
    const elements = published.filter((h) => h.kind === "ui_element");
    return {
      collections: [
        {
          id: "reviewed",
          name: "Reviewed captures",
          count: published.length,
        },
        {
          id: "ui_elements",
          name: "Tagged UI elements (regions)",
          count: elements.length,
        },
        {
          id: "loaders",
          name: "Loaders & skeletons",
          count: published.filter((h) => h.hasMotion).length,
        },
      ],
    };
  }

  if (name === "list_patterns") {
    const patterns = await listPatterns({
      kind: args.kind ? (String(args.kind) as PatternKind) : undefined,
      journey: args.journey ? String(args.journey) : undefined,
      vertical: args.vertical ? String(args.vertical) : undefined,
      region: args.region ? String(args.region) : undefined,
      query: args.query ? String(args.query) : query || undefined,
      limit: typeof args.limit === "number" ? args.limit : 40,
    });
    return {
      source: "pattern_index",
      provenance: "measured",
      results: patterns,
      count: patterns.length,
      hint: patterns.length
        ? undefined
        : "Pattern index empty — Approve captures and set operator vertical/referenceTier in /admin.",
    };
  }

  if (name === "most_used_pattern") {
    const hit = await mostUsedPattern({
      kind: args.kind ? (String(args.kind) as PatternKind) : undefined,
      journey: args.journey ? String(args.journey) : undefined,
      vertical: args.vertical ? String(args.vertical) : undefined,
      query: args.query ? String(args.query) : query || undefined,
    });
    if (!hit) {
      return {
        error: "No patterns matched",
        hint: "Broaden filters or capture more operators.",
      };
    }
    return {
      source: "pattern_index",
      ...hit,
      citations: hit.examples.flatMap((e) => e.evidenceIds),
    };
  }

  if (name === "get_pattern") {
    const key = String(args.normalized_key ?? args.key ?? "");
    if (!key) return { error: "normalized_key required" };
    const hit = await getPattern(key);
    if (!hit) return { error: `Unknown pattern: ${key}` };
    return {
      source: "pattern_index",
      ...hit,
      citations: hit.fingerprints.flatMap((f) => f.evidenceIds),
    };
  }

  if (name === "compare_operators") {
    const slugs = Array.isArray(args.slugs)
      ? args.slugs.map(String)
      : String(args.slugs ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    if (slugs.length < 2) {
      return { error: "Provide at least 2 operator slugs" };
    }
    const cmp = await compareOperators({
      slugs,
      kind: args.kind ? (String(args.kind) as PatternKind) : undefined,
      journey: args.journey ? String(args.journey) : undefined,
    });
    return { source: "pattern_index", ...cmp };
  }

  if (name === "notable_flows") {
    const result = await notableFlows({
      journey: args.journey ? String(args.journey) : query || undefined,
      vertical: args.vertical ? String(args.vertical) : undefined,
      limit: typeof args.limit === "number" ? args.limit : 20,
    });
    return {
      source: "pattern_index",
      ...result,
      citations: result.results.flatMap((r) => r.evidenceIds),
    };
  }

  return { error: `Unknown tool: ${name}` };
}
