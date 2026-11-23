import { NextResponse } from "next/server";
import { CAPTURE_PLAYBOOKS, playbooksForProducts } from "@/lib/admin/playbooks";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const products = searchParams.getAll("product");
  const playbooks = products.length
    ? playbooksForProducts(products)
    : CAPTURE_PLAYBOOKS;
  return NextResponse.json({ playbooks });
}
