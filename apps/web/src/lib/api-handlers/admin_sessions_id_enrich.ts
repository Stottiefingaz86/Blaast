import { NextResponse } from "next/server";
import { enrichSessionAnnotations } from "@/lib/evidence/enrich-annotations";

export const dynamic = "force-dynamic";

/** Opt-in: extract tag stills + vision enrich for searchable library elements. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { artifactId?: string; forceStills?: boolean } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* empty body ok */
  }

  try {
    const result = await enrichSessionAnnotations(id, {
      artifactId: body.artifactId,
      forceStills: body.forceStills,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Enrich failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
