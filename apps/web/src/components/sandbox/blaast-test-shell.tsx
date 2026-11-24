"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gift,
  Home,
  LayoutGrid,
  Sparkles,
  Trophy,
  Dices,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MCP rebuild sandbox — IA from Whale home tour evidence, our neutral brand.
 * Evidence: ev-rec-e982fe59-a036-48e5-8c84-7f662106babb-home_tour
 * Steps: side_nav, tab_bar, casino lobby regions (banners / providers / feed)
 */

const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "casino", label: "Casino", icon: Dices },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "promos", label: "Promotions", icon: Gift },
  { id: "vip", label: "VIP", icon: Sparkles },
] as const;

const GAMES = [
  "Neon Drift",
  "Glass Roulette",
  "Orbit Slots",
  "Pulse Blackjack",
  "Harbor Keno",
  "Quiet Fortune",
];

const PROVIDERS = ["Studio A", "Studio B", "Studio C", "Studio D", "Studio E"];

const FEED = [
  { user: "alex••", game: "Orbit Slots", amount: "$42" },
  { user: "mira••", game: "Glass Roulette", amount: "$110" },
  { user: "jon••", game: "Pulse Blackjack", amount: "$18" },
  { user: "sam••", game: "Neon Drift", amount: "$67" },
];

export function BlaastTestShell() {
  const [nav, setNav] = useState<(typeof NAV)[number]["id"]>("casino");
  const [product, setProduct] = useState<"casino" | "sports">("casino");
  const [showCite, setShowCite] = useState(true);

  return (
    <div className="flex min-h-screen flex-col bg-[#0e0f12] text-[#e8e8ea]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/library"
            className="text-[12px] text-white/40 transition hover:text-white"
          >
            ← Library
          </Link>
          <span className="text-[12px] text-white/25">/</span>
          <p className="text-[12px] font-medium tracking-wide text-white/70">
            /blaast-test
          </p>
        </div>
        <p className="hidden text-[11px] text-white/35 sm:block">
          MCP sandbox · rebuild IA, not competitor brand
        </p>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Side nav — measured pattern: left global nav rows */}
        <aside className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] bg-[#12141a] py-4 sm:w-[200px] sm:items-stretch sm:px-3">
          <div className="mb-4 flex items-center justify-center gap-2 px-1 sm:justify-start sm:px-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-[13px] font-bold text-emerald-300">
              N
            </span>
            <span className="hidden text-[14px] font-semibold tracking-tight sm:inline">
              North
            </span>
          </div>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = nav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setNav(item.id)}
                className={cn(
                  "flex items-center justify-center gap-2.5 rounded-xl px-0 py-2.5 text-[13px] transition sm:justify-start sm:px-3",
                  active
                    ? "bg-white/[0.08] font-medium text-white"
                    : "text-white/45 hover:bg-white/[0.04] hover:text-white/80",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Product switcher — measured: Casino ↔ Sports */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-6">
            <div className="inline-flex rounded-full bg-white/[0.05] p-1">
              {(["casino", "sports"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setProduct(p);
                    setNav(p);
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12px] font-medium capitalize transition",
                    product === p
                      ? "bg-white text-[#111]"
                      : "text-white/50 hover:text-white",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="hidden h-8 rounded-full border border-white/10 px-3 text-[12px] text-white/70 sm:inline-flex sm:items-center"
              >
                Log in
              </button>
              <button
                type="button"
                className="h-8 rounded-full bg-emerald-400 px-3.5 text-[12px] font-semibold text-[#0a1a12]"
              >
                Sign up
              </button>
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {/* Banner strip — lobby banner region pattern */}
            <section className="mb-6 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/50 via-[#1a2230] to-[#12141a] p-6 ring-1 ring-white/[0.06]">
                <p className="text-[11px] font-medium tracking-wide text-emerald-300/80 uppercase">
                  Featured
                </p>
                <h1 className="mt-2 max-w-sm text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">
                  Welcome back — your lobby is ready
                </h1>
                <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/50">
                  Placeholder copy for our brand. Structure mirrors a casino
                  lobby banner row from Blaast evidence — not Whale assets.
                </p>
                <button
                  type="button"
                  className="mt-5 h-9 rounded-full bg-white px-4 text-[12px] font-semibold text-[#111]"
                >
                  Explore games
                </button>
              </div>
              <div className="grid gap-3 sm:grid-rows-2">
                <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06]">
                  <p className="text-[11px] text-white/40">Rewards</p>
                  <p className="mt-1 text-[15px] font-medium">Cashback ready</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06]">
                  <p className="text-[11px] text-white/40">VIP</p>
                  <p className="mt-1 text-[15px] font-medium">Level progress</p>
                </div>
              </div>
            </section>

            {/* Game cards row */}
            <section className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[14px] font-semibold">
                  <LayoutGrid className="size-4 text-white/40" />
                  Popular games
                </h2>
                <span className="text-[12px] text-white/35">See all</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {GAMES.map((name, i) => (
                  <div
                    key={name}
                    className="w-[140px] shrink-0 overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]"
                  >
                    <div
                      className="aspect-[4/5] bg-gradient-to-b from-white/[0.08] to-transparent"
                      style={{
                        backgroundImage: `linear-gradient(145deg, hsl(${150 + i * 28} 28% 22%), #12141a)`,
                      }}
                    />
                    <p className="truncate px-2.5 py-2 text-[12px] font-medium">
                      {name}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Providers hub */}
            <section className="mb-7">
              <h2 className="mb-3 text-[14px] font-semibold">Providers</h2>
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[12px] text-white/60 ring-1 ring-white/[0.06]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </section>

            {/* Activity feed */}
            <section className="mb-8">
              <h2 className="mb-3 text-[14px] font-semibold">Live activity</h2>
              <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
                {FEED.map((row) => (
                  <li
                    key={row.user + row.game}
                    className="flex items-center gap-3 px-4 py-3 text-[13px]"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-semibold text-white/60">
                      {row.user.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-white/70">
                      <span className="text-white/90">{row.user}</span> won on{" "}
                      {row.game}
                    </span>
                    <span className="tabular-nums text-emerald-300/90">
                      {row.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </main>
        </div>
      </div>

      {showCite && (
        <footer className="shrink-0 border-t border-white/[0.06] bg-[#0a0b0e] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 text-[11px] leading-relaxed text-white/40">
              <p className="font-medium text-white/55">Evidence citations</p>
              <p className="mt-0.5 break-all">
                home_tour{" "}
                <code className="text-white/50">
                  ev-rec-e982fe59-a036-48e5-8c84-7f662106babb-home_tour
                </code>
              </p>
              <p>
                casino lobby regions · Whale reference IA only · no logos copied
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCite(false)}
              className="text-[11px] text-white/35 hover:text-white/70"
            >
              Hide
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
