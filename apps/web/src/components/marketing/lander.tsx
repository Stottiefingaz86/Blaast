"use client";

import Link from "next/link";
import { ArrowRight, Library } from "lucide-react";
import { MarketingNav } from "@/components/marketing/site-nav";
import { AnimatedHeadline } from "@/components/marketing/animated-headline";
import { CategoryBrandHover } from "@/components/marketing/category-brand-hover";
import { LanderLibraryProof } from "@/components/marketing/lander-library-proof";
import { LogoWall } from "@/components/marketing/logo-wall";
import { useSession } from "@/lib/library/session";

const WHAT_WE_DO = [
  {
    kicker: "01",
    title: "Screens",
    body: "Full pages from sportsbooks and casinos. Captured at the real desktop or mobile viewport, so what you see is what shipped in market.",
  },
  {
    kicker: "02",
    title: "Flows",
    body: "End-to-end journeys: registration, deposit, bet placement, cashier, and more. Step through with evidence attached to every frame.",
  },
  {
    kicker: "03",
    title: "UI elements",
    body: "Betslips, lobbies, nav, loaders, odds buttons. Tagged and searchable so you find the pattern, not a random screenshot.",
  },
  {
    kicker: "04",
    title: "MCP for agents",
    body: "The same library over one URL in Cursor, Claude, ChatGPT, VS Code, Windsurf, and Codex. Cite live captures while you design.",
  },
] as const;

const PRODUCTS = [
  {
    name: "Library",
    status: "Live",
    line: "Browse operators, screens, elements, and flows with full provenance.",
    href: "/library",
  },
  {
    name: "MCP",
    status: "Live",
    line: "Pull Blaast into your AI tools. One connection, every approved capture.",
    href: "/mcp",
  },
  {
    name: "Studio",
    status: "Soon",
    line: "Brief with live patterns. Prototype under your own design system.",
    href: "/studio",
  },
  {
    name: "Research",
    status: "Soon",
    line: "Competitive audits, journey scores, and player CX benchmarks.",
    href: "/research",
  },
] as const;

/** High-end sales lander. Hero kept; everything below rebuilt. */
export function Lander() {
  const { loggedIn } = useSession();
  const primaryHref = loggedIn ? "/library" : "/login?mode=signup";
  const primaryLabel = loggedIn ? "Open library" : "Join for free";

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <MarketingNav solid />

      {/* Hero — keep */}
      <section className="mx-auto flex max-w-[1040px] flex-col items-center px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
        <div className="animate-fade-up">
          <AnimatedHeadline />
        </div>

        <p className="animate-fade-up stagger-1 mx-auto mt-8 max-w-[36rem] text-[18px] leading-relaxed text-neutral-600 sm:text-[20px] sm:leading-[1.55]">
          Blaast is the design research library for iGaming. Real sportsbook and
          casino screens, flows, and UI. Captured live. Searchable. Ready for
          your tools via MCP.
        </p>

        <div className="animate-fade-up stagger-2 mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-neutral-950 px-8 text-[15px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loggedIn ? (
              <Library className="size-4" strokeWidth={1.75} />
            ) : null}
            {primaryLabel}
          </Link>
          <Link
            href="/mcp"
            className="inline-flex h-12 items-center gap-1.5 rounded-full px-6 text-[15px] font-medium text-neutral-800 transition-colors hover:bg-neutral-100"
          >
            Connect MCP
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Operators */}
      <section className="overflow-hidden pb-16 sm:pb-20">
        <p className="mb-8 text-center text-[12px] font-medium tracking-[0.16em] text-neutral-400 uppercase">
          Captured from operators that set the bar
        </p>
        <LogoWall />
      </section>

      {/* Library proof — light dense cards */}
      <LanderLibraryProof />

      {/* What we do — large editorial type */}
      <section className="mx-auto max-w-[1100px] px-6 pt-24 pb-8 sm:pt-32">
        <p className="text-[13px] font-medium tracking-[0.12em] text-neutral-400 uppercase">
          What we do
        </p>
        <h2 className="mt-4 max-w-[14ch] text-[2.75rem] font-semibold tracking-[-0.035em] text-neutral-950 sm:text-[3.5rem] sm:leading-[1.05] lg:text-[4rem]">
          Proof from the market. Not moodboards.
        </h2>
        <p className="mt-6 max-w-[40rem] text-[18px] leading-relaxed text-neutral-500 sm:text-[20px] sm:leading-[1.5]">
          Designers, researchers, and product teams use Blaast to see how the
          best sportsbooks and casinos actually ship. Every clip keeps operator,
          device, and provenance.
        </p>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-20 sm:pb-28">
        <ul className="mt-10 divide-y divide-neutral-100 border-t border-neutral-100">
          {WHAT_WE_DO.map((item) => (
            <li
              key={item.title}
              className="grid gap-4 py-10 sm:grid-cols-[5rem_minmax(0,14rem)_minmax(0,1fr)] sm:gap-10 sm:py-14"
            >
              <span className="text-[13px] font-medium tracking-wide text-neutral-400">
                {item.kicker}
              </span>
              <h3 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[2rem]">
                {item.title}
              </h3>
              <p className="max-w-xl text-[17px] leading-relaxed text-neutral-500 sm:text-[18px] sm:leading-[1.55]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Pattern browse */}
      <section className="border-t border-neutral-100">
        <div className="mx-auto max-w-[1100px] px-6 py-20 sm:py-28">
          <p className="text-[13px] font-medium tracking-[0.12em] text-neutral-400 uppercase">
            Browse
          </p>
          <h2 className="mt-4 max-w-[16ch] text-[2.5rem] font-semibold tracking-[-0.035em] text-neutral-950 sm:text-[3.25rem] sm:leading-[1.05]">
            The same taxonomy as the library.
          </h2>
          <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-neutral-500">
            Hover a pattern to see who we&apos;ve captured.
          </p>
          <div className="mt-12">
            <CategoryBrandHover />
          </div>
        </div>
      </section>

      {/* Product map */}
      <section className="border-t border-neutral-100">
        <div className="mx-auto max-w-[1100px] px-6 py-20 sm:py-28">
          <p className="text-[13px] font-medium tracking-[0.12em] text-neutral-400 uppercase">
            The platform
          </p>
          <h2 className="mt-4 max-w-[14ch] text-[2.5rem] font-semibold tracking-[-0.035em] text-neutral-950 sm:text-[3.25rem] sm:leading-[1.05]">
            Everything starts in the library.
          </h2>
          <ul className="mt-14">
            {PRODUCTS.map((row) => (
              <li key={row.name}>
                <Link
                  href={row.href}
                  className="group flex flex-col gap-3 border-t border-neutral-100 py-10 transition-colors sm:flex-row sm:items-baseline sm:gap-12 sm:py-12"
                >
                  <span className="flex w-full items-baseline justify-between gap-4 sm:w-[12rem] sm:shrink-0 sm:flex-col sm:gap-2">
                    <span className="text-[2rem] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[2.35rem]">
                      {row.name}
                    </span>
                    <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      {row.status}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 text-[17px] leading-relaxed text-neutral-500 transition-colors group-hover:text-neutral-800 sm:text-[18px]">
                    {row.line}
                  </span>
                  <ArrowRight className="mt-1 size-5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-neutral-950 sm:mt-2" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Close */}
      <section className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-[820px] flex-col items-center px-6 py-24 text-center sm:py-32">
          <h2 className="text-[2.5rem] font-semibold tracking-[-0.035em] text-neutral-950 sm:text-[3.25rem] sm:leading-[1.05]">
            Stop guessing what world-class looks like.
          </h2>
          <p className="mt-6 text-[18px] leading-relaxed text-neutral-500 sm:text-[20px]">
            Join free. Open the library. Or wire MCP into your stack today.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center rounded-full bg-neutral-950 px-8 text-[15px] font-medium text-white"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/mcp"
              className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium text-neutral-800 ring-1 ring-neutral-200"
            >
              Connect MCP
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-8 px-6 pt-16 pb-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="text-[13px] text-neutral-500">
            © Blaast {new Date().getFullYear()}
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] text-neutral-400">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/mcp" className="hover:text-white">
              MCP
            </Link>
            <Link href="/library" className="hover:text-white">
              Library
            </Link>
            <Link href="/studio" className="hover:text-white">
              Studio
            </Link>
            <Link href="/research" className="hover:text-white">
              Research
            </Link>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <Link href="/login" className="hover:text-white">
              Log in
            </Link>
          </div>
        </div>
        {/* Full-viewport wordmark — edge to edge, clipped like Mobbin */}
        <div
          className="pointer-events-none relative z-0 w-full select-none overflow-hidden"
          aria-hidden
        >
          <p
            className="relative left-1/2 w-screen max-w-none -translate-x-1/2 translate-y-[38%] text-center font-semibold leading-none tracking-[-0.08em] text-white/[0.09] whitespace-nowrap"
            style={{ fontSize: "calc(100vw / 4.85)" }}
          >
            Blaast
          </p>
        </div>
      </footer>
    </div>
  );
}
