import type {
  FlowEvidence,
  ReplicatePromptCitation,
  ReplicatePromptResult,
} from "@/lib/evidence/types";

/** Structured replicate prompt from typed evidence — measured media + layout, not a screenshot dump. */
export function buildEvidenceTemplate(
  evidence: FlowEvidence,
  origin: string,
): ReplicatePromptResult {
  const citations: ReplicatePromptCitation[] = evidence.steps.map((s) => ({
    stepId: s.stepId,
    label: s.label,
    roles: s.observations.map((o) => o.role),
  }));

  const stepBlocks = evidence.steps
    .map((s) => {
      const roles = s.observations.map((o) => o.role).join(", ");
      const obs = s.observations
        .map((o) => `   - [${o.provenance}] ${o.role}: ${o.note}`)
        .join("\n");
      const goals = s.goals.map((g) => `   - ${g}`).join("\n");
      const layout = s.layoutNotes.map((n) => `   - ${n}`).join("\n");
      const tags = s.tags.length ? s.tags.join(", ") : "n/a";
      const media = s.artifacts
        .filter((a) => a.url)
        .map((a) => `   - ${a.kind}: ${a.url} [${a.provenance}]`)
        .join("\n");
      const regions = (s.structureRegions || [])
        .slice(0, 12)
        .map((r) => {
          const box = `${r.box.width}×${r.box.height} @(${r.box.x},${r.box.y})`;
          const style = r.styles
            ? Object.entries(r.styles)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ")
            : "";
          return `   - ${r.role} \`${r.selectorHint}\` ${box}${r.textPreview ? ` “${r.textPreview}”` : ""}${style ? ` {${style}}` : ""}`;
        })
        .join("\n");
      const motion = (s.motionHints || [])
        .slice(0, 8)
        .map(
          (m) =>
            `   - ${m.name} ${m.durationMs != null ? `${m.durationMs}ms` : ""} ${m.easing || ""} ${m.iterationCount || ""} (${m.source})${m.targetHint ? ` → ${m.targetHint}` : ""}`,
        )
        .join("\n");

      return `### Step ${s.index + 1}: ${s.label} (${s.surfaceKind})
Tags: ${tags}
Goals:
${goals || "   - n/a"}
UI roles: ${roles || "other"}
Observations:
${obs || "   - n/a"}
Layout notes:
${layout || "   - n/a"}
Measured media:
${media || "   - none attached"}
Measured regions (structure snapshot):
${regions || "   - none (structure not captured)"}
Measured motion:
${motion || "   - none detected"}`;
    })
    .join("\n\n");

  const isChromeBeat = /ui-side-nav|ui-tab-bar|ui-header|scr-casino-lobby/i.test(
    evidence.evidenceId,
  );

  const taskBlock = isChromeBeat
    ? `## Task
**Exact chrome fidelity.** Match layout, colours, spacing, hover/active states, and IA from the measured stills/video for this beat. Open poster_url / video_url and crop regions before coding. Do not approximate from memory or a different operator. For production customer rebuilds, swap brand tokens after the structure matches.`
    : `## Task
Mimic interaction, information architecture, carousel/lobby behaviour, content order, and motion (if measured). Prefer measured regions over memory. Do not copy logos/trademarks into customer production builds.`;

  const prompt = `Use **Blaast MCP** to load measured evidence, then rebuild from the attached media.

${taskBlock}

## Reference IDs (pass these to MCP)
- Evidence ID: \`${evidence.evidenceId}\`
- Operator: ${evidence.operatorName} — ${evidence.operatorTagline}
- Confidence: ${evidence.confidence}
- Category: ${evidence.category}
- Flow: ${evidence.flowName} (${evidence.group})
- Tags: ${evidence.tags.join(", ") || "n/a"}
- Actions: ${evidence.actions.join(", ") || "n/a"}
- Platform: ${evidence.platform}
- Has motion capture: ${evidence.hasVideo ? "yes" : "no"}
- Library: ${origin}${evidence.libraryPath}

## MCP (preferred)
1. \`get_evidence\` with evidence_id=\`${evidence.evidenceId}\`
2. \`get_flow\` / \`search_ui\` / \`search_screens\` as needed for lobby, carousel, game card, launch
3. Treat returned media, regions, and motion as measured ground truth

## Constraints (non-negotiable)
1. Do **not** copy logos, trademarks, proprietary illustration, or verbatim marketing copy.
2. Prefer **measured** regions, styles, and motion timings below over inferred guesses.
3. Never invent payment credentials, KYC documents, or secret fields.
4. Responsible gambling / age gates: keep clear exit and help paths if present.
5. Cite evidence step ids when explaining decisions.
6. If motion is listed (loader/skeleton), match **duration / easing / iteration** from measured hints — do not invent a random spinner.

## Journey steps
${stepBlocks}

## Output
Produce:
1. Screen-by-screen layout (regions + hierarchy) mapped from measured regions when present.
2. Component mapping to our design system (or flagged exceptions).
3. Interaction notes (selection → betslip/ticket → confirm → receipt).
4. Motion implementation notes when measured motion exists (CSS animation / transition timings).
5. Open questions / missing measured evidence.

Start implementation only after summarizing the pattern in 5 bullets.`;

  return {
    prompt,
    source: "evidence_template",
    evidenceId: evidence.evidenceId,
    flowId: evidence.flowId,
    citations,
    generatedAt: new Date().toISOString(),
  };
}
