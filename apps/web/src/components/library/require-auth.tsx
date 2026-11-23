"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/library/session";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loggedIn, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !loggedIn) router.replace("/");
  }, [ready, loggedIn, router]);

  if (!ready || !loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="size-8 animate-pulse rounded-full bg-white/20" />
      </div>
    );
  }

  return <>{children}</>;
}
