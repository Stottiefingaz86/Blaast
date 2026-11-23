"use client";

import Link from "next/link";
import { ArrowRight, WandSparkles } from "lucide-react";
import { MarketingNav } from "@/components/marketing/site-nav";

/** Placeholder only — full Studio ships after capture → MCP evidence is solid. */
export function StudioComingSoon() {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <MarketingNav solid />
      <main className="mx-auto flex max-w-[720px] flex-col items-center px-6 pt-28 pb-24 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-600">
          <WandSparkles className="size-3.5" strokeWidth={1.75} />
          Coming soon
        </span>
        <h1 className="mt-6 text-[2.75rem] leading-[1.05] font-bold tracking-[-0.04em] sm:text-[3.5rem]">
          Studio
        </h1>
        <p className="mt-5 max-w-[34rem] text-[17px] leading-relaxed text-neutral-600">
          Bring your brand tokens. Brief the agent with live operator patterns —
          side navs, betslips, lobbies, onboarding — and ship prototypes under
          your design system. Powered by Blaast captures and MCP.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/library"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-neutral-950 px-6 text-[14px] font-medium text-white"
          >
            Browse the library
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center rounded-full bg-neutral-100 px-6 text-[14px] font-medium text-neutral-800"
          >
            Get MCP
          </Link>
        </div>
      </main>
    </div>
  );
}
