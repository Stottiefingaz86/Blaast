import { NextResponse } from "next/server";
import {
  absoluteOrigin,
  catalogFromPublished,
  listLibraryMedia,
} from "@/lib/library/published-catalog";

export const dynamic = "force-dynamic";

/** Real published captures only — no empty research stubs. */
export async function GET(req: Request) {
  const origin = absoluteOrigin(req.url);
  const [operators, media] = await Promise.all([
    catalogFromPublished(origin),
    listLibraryMedia(origin),
  ]);

  return NextResponse.json({
    source: "published_captures",
    operators,
    media: media.filter((m) => !m.annotationId),
    count: operators.length,
  });
}
