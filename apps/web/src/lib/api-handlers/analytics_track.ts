import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/platform/auth";
import { trackEvent, type AnalyticsEventKind } from "@/lib/platform/analytics-store";
import { bumpMcpConnection, markMcpActivated } from "@/lib/platform/users-store";

export const runtime = "nodejs";

const ALLOWED: AnalyticsEventKind[] = [
  "brand_search",
  "brand_copy",
  "mcp_activate",
];

export async function POST(req: NextRequest) {
  let body: {
    kind?: AnalyticsEventKind;
    brand?: string;
    query?: string;
    tool?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.kind || !ALLOWED.includes(body.kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const user = await getSessionUser();
  if (body.kind === "mcp_activate" && user) {
    await markMcpActivated(user.id);
    await bumpMcpConnection(user.id);
  }
  await trackEvent({
    kind: body.kind,
    userId: user?.id,
    userEmail: user?.email,
    brand: body.brand,
    query: body.query,
    tool: body.tool,
  });
  return NextResponse.json({ ok: true });
}
