/**
 * Mobbin-style glance frames for MCP tool results.
 * Cursor renders `type: "image"` content inline so agents can see screens.
 */

export type McpContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

const MAX_IMAGES = 8;
const MAX_BYTES = 180_000; // ~180KB jpeg each after resize

function mcpThumbUrl(posterUrl: string): string {
  // Prefer dedicated .mcp.jpg when we backfilled it
  if (/\.mcp\.jpe?g(\?|$)/i.test(posterUrl)) return posterUrl;
  if (/\.png(\?|$)/i.test(posterUrl)) {
    return posterUrl.replace(/\.png(\?|$)/i, ".mcp.jpg$1");
  }
  // Supabase image render fallback
  const m = posterUrl.match(
    /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/(.+)$/i,
  );
  if (m) {
    return `${m[1]}/storage/v1/render/image/public/${m[2]}?width=960&quality=55`;
  }
  return posterUrl;
}

async function fetchAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 500 || buf.byteLength > MAX_BYTES * 3) {
      // Too big — try render API shrink if object URL
      if (buf.byteLength > MAX_BYTES * 3) return null;
    }
    if (buf.byteLength > MAX_BYTES) {
      // Still usable but heavy; allow up to soft cap for glance
      if (buf.byteLength > 450_000) return null;
    }
    const ct = res.headers.get("content-type") || "image/jpeg";
    const mimeType = ct.includes("png")
      ? "image/png"
      : ct.includes("webp")
        ? "image/webp"
        : "image/jpeg";
    return { data: buf.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

export type GlanceHit = {
  title?: string;
  operator?: string;
  operatorSlug?: string;
  evidenceId?: string;
  coverageStepId?: string;
  posterUrl?: string;
  poster_url?: string;
  videoUrl?: string;
  video_url?: string;
  id?: string;
  kind?: string;
};

/**
 * Build MCP content: gallery caption + inline images + compact JSON index.
 */
export async function buildVisualSearchContent(opts: {
  tool: string;
  query: string;
  hits: GlanceHit[];
  payload: unknown;
}): Promise<McpContent[]> {
  const hits = opts.hits.slice(0, MAX_IMAGES);
  const content: McpContent[] = [];

  content.push({
    type: "text",
    text: [
      `${hits.length} screens from Blaast library${opts.query ? ` for “${opts.query}”` : ""}.`,
      "Inline frames below — open video_url on a hit for motion / hover / transition.",
      "Use evidenceId with get_evidence for the full replicate prompt.",
    ].join("\n"),
  });

  const index: Array<Record<string, unknown>> = [];

  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]!;
    const poster = h.posterUrl || h.poster_url;
    if (!poster) continue;
    const thumb = mcpThumbUrl(poster);
    let img = await fetchAsBase64(thumb);
    if (!img && thumb !== poster) img = await fetchAsBase64(poster);
    if (!img) continue;

    content.push({
      type: "text",
      text: `[${i + 1}] ${h.operator ?? "?"} · ${h.title ?? h.coverageStepId ?? h.id ?? "screen"} · ${h.evidenceId ?? ""}`,
    });
    content.push({
      type: "image",
      data: img.data,
      mimeType: img.mimeType,
    });

    index.push({
      n: i + 1,
      id: h.id,
      title: h.title,
      operator: h.operator,
      operatorSlug: h.operatorSlug,
      kind: h.kind,
      evidenceId: h.evidenceId,
      coverageStepId: h.coverageStepId,
      poster_url: poster,
      mcp_thumb_url: thumb,
      video_url: h.videoUrl || h.video_url,
    });
  }

  content.push({
    type: "text",
    text: JSON.stringify(
      {
        tool: opts.tool,
        gallery: index,
        count: index.length,
        full: opts.payload,
      },
      null,
      2,
    ),
  });

  return content;
}

export function hitsFromToolPayload(data: unknown): GlanceHit[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.results)) return d.results as GlanceHit[];
  if (Array.isArray(d.published_beats)) return d.published_beats as GlanceHit[];
  return [];
}
