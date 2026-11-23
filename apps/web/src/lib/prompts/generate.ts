import { resolveFlowEvidence } from "@/lib/evidence/index";
import type { ReplicatePromptResult } from "@/lib/evidence/types";
import { buildEvidenceTemplate } from "@/lib/prompts/template";
import { generateWithVision, readVisionConfig } from "@/lib/prompts/vision";

export type GeneratePromptOptions = {
  flowId: string;
  origin: string;
  preferTemplate?: boolean;
};

/**
 * Load evidence (reviewed capture first, demo catalog fallback)
 * → try vision LLM when key + image URLs → else evidence_template.
 */
export async function generateReplicatePrompt(
  opts: GeneratePromptOptions,
): Promise<ReplicatePromptResult> {
  const evidence = await resolveFlowEvidence(opts.flowId, opts.origin);
  if (!evidence) {
    throw new PromptNotFoundError(opts.flowId);
  }

  const template = buildEvidenceTemplate(evidence, opts.origin);

  if (opts.preferTemplate) return template;
  // Never send competitor screenshots to vision without reviewed confidence
  if (evidence.confidence === "demo") return template;

  const config = readVisionConfig();
  if (!config) return template;

  try {
    const llm = await generateWithVision(evidence, opts.origin, config);
    if (llm) return llm;
  } catch (err) {
    console.error("[prompts/generate] vision failed, using template", err);
  }

  return template;
}

export class PromptNotFoundError extends Error {
  constructor(public flowId: string) {
    super(`Unknown flowId: ${flowId}`);
    this.name = "PromptNotFoundError";
  }
}
