import { NextResponse } from "next/server";
import { normalizeSiteUrl } from "@/lib/admin/normalize-url";
import { createOperator, listOperators } from "@/lib/admin/store";
import type {
  OperatorReferenceTier,
  OperatorVertical,
  ProductSurface,
} from "@/lib/admin/types";

export async function GET() {
  const operators = await listOperators();
  return NextResponse.json({ operators });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.name || !body?.url) {
    return NextResponse.json({ error: "name and url required" }, { status: 400 });
  }
  const url = normalizeSiteUrl(String(body.url));
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "url must be absolute http(s)" }, { status: 400 });
  }
  const operator = await createOperator({
    name: String(body.name),
    url,
    markets: Array.isArray(body.markets) ? body.markets.map(String) : [],
    products: Array.isArray(body.products)
      ? (body.products as ProductSurface[])
      : undefined,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    notes: body.notes ? String(body.notes) : undefined,
    vertical: body.vertical
      ? (String(body.vertical) as OperatorVertical)
      : undefined,
    regions: Array.isArray(body.regions) ? body.regions.map(String) : undefined,
    referenceTier:
      body.referenceTier === null || body.referenceTier === ""
        ? null
        : body.referenceTier
          ? (String(body.referenceTier) as OperatorReferenceTier)
          : undefined,
  });
  return NextResponse.json({ operator }, { status: 201 });
}
