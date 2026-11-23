import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { searchPublishedEvidence } from "@/lib/evidence/index";
import { catalogFromPublished } from "@/lib/library/published-catalog";
import { trackEvent } from "@/lib/platform/analytics-store";
import { getSessionUser } from "@/lib/platform/auth";

export const dynamic = "force-dynamic";

/**
 * Library search — returns UI element cards (tagged video moments) matching query.
 * Example: ?q=popular → Popular slots, Popular sports from Rainbet home capture.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const kind = new URL(req.url).searchParams.get("kind") ?? "ui_element";
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;

  if (!q) {
    return NextResponse.json({ query: q, results: [], count: 0 });
  }

  const hits = await searchPublishedEvidence({
    query: q,
    origin,
    kind: kind === "any" ? undefined : kind,
    limit: 40,
  });

  // Also surface matching catalog UI elements (synonyms / curated titles)
  const operators = await catalogFromPublished(origin);
  const elements = operators.flatMap((op) =>
    op.uiElements
      .filter((el) => {
        const hay = `${el.name} ${el.category ?? ""} ${el.searchText ?? ""} ${(el.tags ?? []).join(" ")}`.toLowerCase();
        return q
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .every((w) => hay.includes(w));
      })
      .map((el) => ({
        id: el.id,
        kind: "ui_element" as const,
        title: el.name,
        operator: op.name,
        operatorSlug: op.slug,
        tags: el.tags ?? [],
        category: el.category,
        posterUrl: el.posterUrl,
        videoUrl: el.videoUrl,
        atMs: el.atMs,
        clipWindow: el.clipWindow,
        annotationId: el.annotationId,
        evidenceId: el.evidenceId,
        libraryPath: `/operators/${op.slug}?tab=ui`,
      })),
  );

  const merged = [...elements];
  for (const h of hits) {
    if (!merged.some((m) => m.id === h.id || m.annotationId === h.annotationId)) {
      merged.push({
        id: h.id,
        kind: "ui_element" as const,
        title: h.title,
        operator: h.operator,
        operatorSlug: h.operatorSlug,
        tags: h.tags,
        category: undefined,
        posterUrl: h.posterUrl,
        videoUrl: h.videoUrl,
        atMs: h.atMs,
        clipWindow: h.clipWindow,
        annotationId: h.annotationId,
        evidenceId: h.evidenceId,
        libraryPath: `/operators/${h.operatorSlug.replace(/\./g, "-")}?tab=ui`,
      });
    }
  }

  const results = merged.slice(0, 40);
  const user = await getSessionUser();
  const brandCounts = new Map<string, number>();
  for (const r of results) {
    const b = r.operatorSlug || r.operator;
    if (!b) continue;
    brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1);
  }
  const topBrand =
    [...brandCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? q;
  void trackEvent({
    kind: "brand_search",
    userId: user?.id,
    userEmail: user?.email,
    brand: topBrand,
    query: q,
  });

  return NextResponse.json({
    query: q,
    results,
    count: results.length,
  });
}
