import { NextResponse } from "next/server";
import { rebuildPatternIndex } from "@/lib/patterns/aggregate";

export const dynamic = "force-dynamic";

/** Rebuild `.data/pattern-index.json` from operators + published clips. */
export async function POST() {
  const index = await rebuildPatternIndex();
  return NextResponse.json({
    updatedAt: index.updatedAt,
    fingerprintCount: index.fingerprints.length,
    aggregateCount: index.aggregates.length,
  });
}
