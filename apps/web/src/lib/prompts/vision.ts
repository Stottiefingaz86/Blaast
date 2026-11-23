import type { FlowEvidence, ReplicatePromptResult } from "@/lib/evidence/types";
import { buildEvidenceTemplate } from "@/lib/prompts/template";

export type VisionConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function readVisionConfig(): VisionConfig | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}

/**
 * Multimodal generate when image URLs exist on evidence.
 * If no fetchable images, returns null so caller falls back to template.
 */
export async function generateWithVision(
  evidence: FlowEvidence,
  origin: string,
  config: VisionConfig,
): Promise<ReplicatePromptResult | null> {
  const imageUrls = evidence.steps
    .flatMap((s) => s.artifacts)
    .map((a) => a.url)
    .filter((u): u is string => Boolean(u && /^https?:\/\//i.test(u)));

  // Demo evidence has no real frames yet — skip LLM until capture attaches URLs
  if (imageUrls.length === 0) return null;

  const skeleton = buildEvidenceTemplate(evidence, origin);
  const system = `You write replicate prompts for iGaming UX agents that use Blaast MCP.
Rules:
- Instruct the agent to call Blaast MCP (get_evidence / get_flow / search_ui) with the given evidence and operator IDs.
- Use measured evidence; label claims as measured vs inferred.
- Never instruct copying logos, trademarks, or proprietary assets.
- Cite evidence / step ids.
- Never say "Mobbin".
- Output a single paste-ready prompt for Cursor/Claude (markdown).`;

  const userText = `Turn this Blaast flow evidence into a high-quality replicate prompt that tells the agent to use Blaast MCP with these IDs.
Library: ${origin}${evidence.libraryPath}

Evidence JSON:
${JSON.stringify(
  {
    evidenceId: evidence.evidenceId,
    flow: evidence.flowName,
    operator: evidence.operatorName,
    platform: evidence.platform,
    steps: evidence.steps.map((s) => ({
      stepId: s.stepId,
      label: s.label,
      goals: s.goals,
      roles: s.observations.map((o) => o.role),
      layoutNotes: s.layoutNotes,
    })),
  },
  null,
  2,
)}

Base template (improve using any images):
${skeleton.prompt}`;

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: userText }];

  for (const url of imageUrls.slice(0, 8)) {
    content.push({ type: "image_url", image_url: { url } });
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Vision API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const prompt = data.choices?.[0]?.message?.content?.trim();
  if (!prompt) throw new Error("Vision API returned empty content");

  return {
    prompt,
    source: "llm",
    model: config.model,
    evidenceId: evidence.evidenceId,
    flowId: evidence.flowId,
    citations: skeleton.citations,
    generatedAt: new Date().toISOString(),
  };
}
