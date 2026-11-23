"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/library/site-header";
import { useSession } from "@/lib/library/session";

/** Scuup-style research — placeholder until P1. */
export default function ResearchPage() {
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

  return (
    <div className="lib-surface min-h-screen">
      <div className="lib-chrome lib-hairline sticky top-0 z-[100] border-b">
        <SiteHeader tab="research" searchPlaceholder="Search research…" />
      </div>
      <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center">
        <p className="text-[12px] font-medium tracking-[0.12em] text-neutral-500 uppercase">
          Coming later
        </p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-white">
          Research
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-400">
          Competitive UX audits, journey evidence, and Scuup-style research on
          the same captures as Library. Not built yet.
        </p>
        <Link
          href="/library"
          className="mt-8 inline-flex h-10 items-center rounded-full bg-white px-5 text-[13px] font-medium text-neutral-950"
        >
          Back to Library
        </Link>
      </div>
    </div>
  );
}
