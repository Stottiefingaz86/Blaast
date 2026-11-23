import { NextResponse } from "next/server";
import { listSessions, startCaptureSession } from "@/lib/admin/store";
import type { Platform } from "@/lib/admin/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const operatorId = searchParams.get("operatorId") || undefined;
  const sessions = await listSessions(operatorId);
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.operatorId || !body?.playbookId || !body?.platform) {
    return NextResponse.json(
      { error: "operatorId, playbookId, platform required" },
      { status: 400 },
    );
  }
  try {
    const session = await startCaptureSession({
      operatorId: String(body.operatorId),
      playbookId: String(body.playbookId),
      platform: body.platform as Platform,
      market: body.market ? String(body.market) : undefined,
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 400 },
    );
  }
}
