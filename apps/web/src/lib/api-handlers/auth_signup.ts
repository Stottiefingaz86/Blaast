import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/platform/auth";
import { trackEvent } from "@/lib/platform/analytics-store";
import { createUser } from "@/lib/platform/users-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const user = await createUser({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      name: body.name,
    });
    await trackEvent({
      kind: "signup",
      userId: user.id,
      userEmail: user.email,
    });
    const res = NextResponse.json({ user });
    setSessionCookie(res, user.id);
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
