import { NextResponse } from "next/server";
import { getOperator, updateOperator } from "@/lib/admin/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const operator = await getOperator(id);
  if (!operator) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ operator });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const operator = await updateOperator(id, body);
  if (!operator) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ operator });
}
