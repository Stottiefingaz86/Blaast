"use client";

import Link from "next/link";
import { ArrowRight, Library } from "lucide-react";
import { BlaastMark } from "@/components/brand/blaast-mark";
import { MarketingNav } from "@/components/marketing/site-nav";
import { AnimatedHeadline } from "@/components/marketing/animated-headline";
import { LogoWall } from "@/components/marketing/logo-wall";
import { McpRotator } from "@/components/marketing/mcp-rotator";
import { ProductPeekRail } from "@/components/marketing/product-peek-rail";
import { PromptComposer } from "@/components/marketing/prompt-composer";
import {
  OPERATOR_LOGOS,
  SCENARIO_PROMPTS,
} from "@/lib/marketing/operator-logos";
import { OperatorMark } from "@/components/marketing/operator-mark";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/library/session";

/**
 * Mobbin-clean lander:
 * hero = headline + sub + CTAs only.
 * Logos live in the headline; trust strip + briefs sit below the fold.
 */
export function Lander() {
  const router = useRouter();
  const { loggedIn } = useSession();
  const go = (prompt?: string) => {
    const q = prompt ? `?brief=${encodeURIComponent(prompt)}` : "";
    router.push(loggedIn ? `/library${q}` : `/login${q}`);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <MarketingNav solid />

      {/* Hero — chunky type, rotating use-cases, operator bubbles */}
      <section className="mx-auto flex max-w-[1040px] flex-col items-center px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
        <div className="animate-fade-up">
          <AnimatedHeadline />
        </div>

        <p className="animate-fade-up stagger-1 mx-auto mt-7 max-w-[36rem] text-[17px] leading-relaxed text-neutral-600 sm:text-[18px]">
          Every UI element from live operators: onboarding, home, side navs,
          search, lobbies, betslip, cashier, VIP, and promotions. Browse the
          library or <McpRotator />.
        </p>

        <div className="animate-fade-up stagger-2 mt-10 flex flex-wrap items-center justify-center gap-3">
          {loggedIn ? (
            <Link
              href="/library"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-7 text-[15px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Library className="size-4" strokeWidth={1.75} />
              Library
            </Link>
          ) : (
            <Link
              href="/login?mode=signup"
              className="inline-flex h-12 items-center rounded-full bg-neutral-950 px-7 text-[15px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Join for free
            </Link>
          )}
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center gap-1.5 rounded-full bg-neutral-100 px-6 text-[15px] font-medium text-neutral-800 transition-colors hover:bg-neutral-200"
          >
            Get MCP
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Product peek */}
      <section className="relative w-full bg-neutral-100 pt-8 sm:pt-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="animate-scale-in overflow-hidden rounded-t-[20px] border border-b-0 border-neutral-200/80 bg-black shadow-[0_-8px_60px_rgba(0,0,0,0.12)]">
            <div className="flex h-12 items-center gap-3 border-b border-white/[0.08] px-4 sm:px-5">
              <BlaastMark className="h-5" />
              <span className="text-[13px] text-neutral-500">Library</span>
              <span className="rounded-full bg-white/[0.1] px-2.5 py-0.5 text-[12px] text-white">
                Web
              </span>
              <div className="mx-auto hidden h-8 max-w-md flex-1 rounded-full bg-white/[0.08] sm:block" />
              <span className="size-7 rounded-full bg-emerald-600" />
            </div>

            <div className="grid grid-cols-2 gap-8 px-5 py-8 text-left sm:grid-cols-4 sm:gap-10 sm:px-8">
              {[
                ["Categories", "Sportsbook", "Casino", "Cashier", "Rewards & VIP"],
                ["Screens", "Home", "Onboarding", "Lobby", "Search"],
                ["UI Elements", "Side nav", "Header", "Tab bar", "Game card"],
                ["Flows", "Place a bet", "First deposit", "KYC", "Cash out"],
              ].map(([h, ...items]) => (
                <div key={h}>
                  <p className="mb-3 text-[12px] text-neutral-500">{h}</p>
                  <ul className="space-y-2.5 text-[14px] font-medium text-neutral-200">
                    {items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <ProductPeekRail />
          </div>
        </div>
      </section>

      {/* Operator marquee — full bleed */}
      <section className="overflow-hidden border-b border-neutral-100 py-14">
        <p className="mb-8 text-center text-[11px] font-medium tracking-[0.16em] text-neutral-400 uppercase">
          Captured across operators
        </p>
        <LogoWall />
      </section>

      {/* Briefs */}
      <section className="mx-auto max-w-[1000px] px-6 py-24 text-center">
        <h2 className="text-[2rem] font-semibold tracking-tight text-neutral-950 sm:text-[2.5rem] sm:leading-[1.1]">
          Brief any pattern.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-neutral-600">
          Casino lobbies, VIP rewards, promotions menus, filters, betslips —
          grounded in real captures, shipped under your brand.
        </p>
        <div className="mx-auto mt-10 max-w-xl text-left">
          <PromptComposer onSend={(prompt) => go(prompt)} />
        </div>
        <div className="mt-14 grid text-left sm:grid-cols-2 sm:gap-x-10">
          {SCENARIO_PROMPTS.slice(0, 16).map((prompt, i) => {
            const op = OPERATOR_LOGOS[i % OPERATOR_LOGOS.length]!;
            return (
              <button
                key={prompt}
                type="button"
                onClick={() => go(prompt)}
                className="group flex items-center gap-3.5 border-b border-neutral-100 py-3.5 text-left transition-colors first:pt-0 hover:border-neutral-300"
              >
                <span className="relative size-9 shrink-0 overflow-hidden rounded-[11px] shadow-[0_3px_10px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08]">
                  <OperatorMark op={op} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-neutral-800 group-hover:text-neutral-950">
                  {prompt}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-700" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-neutral-100">
        <div className="mx-auto grid max-w-[1000px] gap-12 px-6 py-20 sm:grid-cols-3">
          {[
            {
              title: "Operators",
              body: "Browse sportsbook and casino brands with journey previews — Mobbin grid, iGaming labels.",
            },
            {
              title: "Flows",
              body: "Step deposit, betslip, racing, and onboarding theaters with copy-ready agent prompts.",
            },
            {
              title: "MCP",
              body: "One URL for Cursor, Claude, and ChatGPT — search screens and flows from your agent.",
            },
          ].map((c) => (
            <div key={c.title}>
              <h3 className="text-[17px] font-semibold tracking-tight">
                {c.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-500">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-neutral-950 px-6 py-14 text-white">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-10 sm:flex-row sm:justify-between">
          <BlaastMark className="h-7" />
          <div className="flex flex-wrap gap-x-10 gap-y-6 text-[14px] text-neutral-400">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/mcp" className="hover:text-white">
              MCP
            </Link>
            <Link href="/library" className="hover:text-white">
              Library
            </Link>
            <Link href="/customers" className="hover:text-white">
              Customers
            </Link>
            <Link href="/login" className="hover:text-white">
              Log in
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-12 max-w-[1000px] text-[12px] text-neutral-600">
          © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
