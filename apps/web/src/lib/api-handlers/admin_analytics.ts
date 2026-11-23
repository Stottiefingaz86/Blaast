import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/platform/auth";
import { getAnalyticsSummary } from "@/lib/platform/analytics-store";
import { listUsers } from "@/lib/platform/users-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const days = Number(req.nextUrl.searchParams.get("days") ?? "90");
  const summary = await getAnalyticsSummary({
    sinceDays: Number.isFinite(days) ? days : 90,
  });
  const users = await listUsers();
  const mcpActivatedUsers = users.filter((u) => u.mcpActivatedAt).length;
  return NextResponse.json({
    ...summary,
    usersTotal: users.length,
    mcpActivatedUsers,
    planBreakdown: {
      free: users.filter((u) => u.plan === "free").length,
      pro: users.filter((u) => u.plan === "pro").length,
      team: users.filter((u) => u.plan === "team").length,
      enterprise: users.filter((u) => u.plan === "enterprise").length,
    },
  });
}
