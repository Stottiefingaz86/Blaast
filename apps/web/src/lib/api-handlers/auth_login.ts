import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/platform/auth";
import { trackEvent } from "@/lib/platform/analytics-store";
import { authenticate } from "@/lib/platform/users-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const user = await authenticate(
    String(body.email ?? ""),
    String(body.password ?? ""),
  );
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }
  await trackEvent({
    kind: "login",
    userId: user.id,
    userEmail: user.email,
  });
  const res = NextResponse.json({ user });
  setSessionCookie(res, user.id);
  return res;
}
