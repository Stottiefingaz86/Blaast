import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/platform/auth";
import {
  listUsers,
  updateUserPlan,
  updateUserRole,
  type PlatformRole,
} from "@/lib/platform/users-store";
import type { PlanId } from "@/lib/platform/plans";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { userId?: string; plan?: PlanId; role?: PlatformRole };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = body.userId;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (body.role) {
    try {
      const user = await updateUserRole(userId, body.role);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Role update failed" },
        { status: 400 },
      );
    }
  }

  const plan = body.plan;
  if (!plan) {
    return NextResponse.json(
      { error: "plan or role required" },
      { status: 400 },
    );
  }
  if (!["free", "pro", "team", "enterprise"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const user = await updateUserPlan(userId, plan);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}
