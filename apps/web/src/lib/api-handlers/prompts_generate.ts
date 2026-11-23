import { NextRequest, NextResponse } from "next/server";
import {
  generateReplicatePrompt,
  PromptNotFoundError,
} from "@/lib/prompts/generate";
import { loadFlowEvidence } from "@/lib/evidence/from-catalog";

export const runtime = "nodejs";

function originFrom(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  const flowId = req.nextUrl.searchParams.get("flowId");
  if (!flowId) {
    return NextResponse.json(
      { error: "flowId query param required" },
      { status: 400 },
    );
  }
  const preferTemplate =
    req.nextUrl.searchParams.get("preferTemplate") === "1";

  try {
    const result = await generateReplicatePrompt({
      flowId,
      origin: originFrom(req),
      preferTemplate,
    });
    const evidence = loadFlowEvidence(flowId);
    return NextResponse.json({
      ...result,
      evidenceSummary: evidence
        ? {
            confidence: evidence.confidence,
            stepCount: evidence.steps.length,
            hasVideo: evidence.hasVideo,
          }
        : null,
    });
  } catch (err) {
    if (err instanceof PromptNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: { flowId?: string; preferTemplate?: boolean };
  try {
    body = (await req.json()) as { flowId?: string; preferTemplate?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const flowId = body.flowId?.trim();
  if (!flowId) {
    return NextResponse.json({ error: "flowId required" }, { status: 400 });
  }

  try {
    const result = await generateReplicatePrompt({
      flowId,
      origin: originFrom(req),
      preferTemplate: Boolean(body.preferTemplate),
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PromptNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
