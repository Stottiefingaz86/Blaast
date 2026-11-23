import { NextResponse } from "next/server";
import { loadScuupResearch } from "@/lib/scuup/research";
import { scuupConfigured } from "@/lib/scuup/client";

export const dynamic = "force-dynamic";

/** Debug / admin: Scuup research inventory from shared Supabase. */
export async function GET() {
  if (!scuupConfigured()) {
    return NextResponse.json(
      {
        error: "Scuup Supabase not configured",
        hint: "Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY from Surchly .env.local",
      },
      { status: 503 },
    );
  }
  try {
    const research = await loadScuupResearch();
    return NextResponse.json(research);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
