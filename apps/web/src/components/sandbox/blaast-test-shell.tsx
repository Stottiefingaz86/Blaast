"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  CircleHelp,
  Dices,
  Flame,
  FolderHeart,
  Gamepad2,
  Heart,
  Home,
  Joystick,
  Lightbulb,
  Menu,
  MessageCircle,
  Monitor,
  Search,
  Sparkles,
  Spade,
  Target,
  Trophy,
  User,
  Users,
  Wallet,
} from "lucide-react";

/**
 * /blaast-test shell — measured from Blaast library Stake stills (not web search).
 * Evidence posters (CDN first-frame):
 *   scr-casino-lobby 9ac80c76… / flow-game-launch 3fa76b56…
 *   promo 0d55f04c… / account 80db3a2b…
 * IA: top logo+wallet+utils · casino side nav My Casino / Games · empty main.
 * Brand wordmark = Blaast (no competitor logo).
 */

/** Sampled from library posters (.tmp/stake-nav/*.png) */
const S = {
  bg: "#12171a",
  side: "#191f24",
  elev: "#212a2f",
  chrome: "#2a343a",
  muted: "#7f8b93",
  text: "#e8eef2",
  blue: "#1475e1",
  green: "#00e701",
} as const;

const MY_CASINO = [
  { id: "home", label: "Casino Home", icon: Home },
  { id: "saved", label: "Saved Games", icon: FolderHeart },
  { id: "following", label: "Following", icon: Heart },
  { id: "continue", label: "Continue Playing", icon: Joystick },
  { id: "foryou", label: "Games For You", icon: Sparkles },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "bets", label: "My Bets", icon: Trophy },
  { id: "challenges", label: "Challenges", icon: Target },
] as const;

const GAMES = [
  { id: "only", label: "Only here", icon: Sparkles },
  { id: "new", label: "New Releases", icon: Flame },
  { id: "slots", label: "Slots", icon: Gamepad2 },
  { id: "originals", label: "Originals", icon: Dices },
  { id: "live", label: "Live Casino", icon: Spade },
] as const;

export function BlaastTestShell() {
  const [active, setActive] = useState("home");
  const [sideOpen, setSideOpen] = useState(true);

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[13px]"
      style={{ background: S.bg, color: S.text }}
    >
      {/* Top nav — measured: logo · wallet · search/bell/user/chat */}
      <header
        className="flex h-[56px] shrink-0 items-center gap-3 px-3"
        style={{ background: S.bg }}
      >
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setSideOpen((o) => !o)}
          className="flex size-9 items-center justify-center rounded-md"
          style={{ color: S.muted }}
        >
          <Menu className="size-5" />
        </button>

        {/* Compact product icons — measured on lobby/promo stills */}
        <div
          className="hidden items-center gap-0.5 rounded-full p-0.5 sm:flex"
          style={{ background: S.elev }}
        >
          <span
            className="flex size-8 items-center justify-center rounded-full"
            style={{ background: S.chrome }}
            title="Home"
          >
            <Home className="size-3.5" />
          </span>
          <span
            className="flex size-8 items-center justify-center rounded-full"
            style={{ color: S.muted }}
            title="Casino"
          >
            <Spade className="size-3.5" />
          </span>
          <span
            className="flex size-8 items-center justify-center rounded-full"
            style={{ color: S.muted }}
            title="Sports"
          >
            <Trophy className="size-3.5" />
          </span>
        </div>

        <span className="text-[17px] font-semibold tracking-tight">Blaast</span>

        <div className="ml-auto flex items-center gap-2">
          <div
            className="flex h-9 items-center gap-2 rounded-md pl-3"
            style={{ background: S.elev }}
          >
            <span className="tabular-nums text-[12px]" style={{ color: S.muted }}>
              0.00
            </span>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md"
              style={{ background: S.blue, color: "#fff" }}
              title="Wallet"
            >
              <Wallet className="size-3.5" />
            </button>
          </div>
          <IconBtn label="Search">
            <Search className="size-4" />
          </IconBtn>
          <IconBtn label="Notifications">
            <Bell className="size-4" />
          </IconBtn>
          <IconBtn label="Account">
            <User className="size-4" />
          </IconBtn>
          <IconBtn label="Chat">
            <MessageCircle className="size-4" />
          </IconBtn>
          <Link
            href="/library"
            className="ml-1 hidden text-[11px] lg:inline"
            style={{ color: S.muted }}
          >
            /blaast-test
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {sideOpen && (
          <aside
            className="flex w-[240px] shrink-0 flex-col overflow-hidden rounded-tr-xl"
            style={{ background: S.side }}
          >
            {/* Nested casino header — measured “< Casino” */}
            <button
              type="button"
              className="flex h-11 items-center gap-1.5 px-3 text-left font-semibold"
              style={{ color: S.text }}
            >
              <ChevronLeft className="size-4" style={{ color: S.muted }} />
              Casino
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              <p
                className="mb-1 px-2 pt-1 text-[11px] font-semibold tracking-wide uppercase"
                style={{ color: S.muted }}
              >
                My Casino
              </p>
              <nav className="flex flex-col gap-0.5">
                {MY_CASINO.map((item) => {
                  const Icon = item.icon;
                  const on = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActive(item.id)}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left"
                      style={{
                        background: on ? S.elev : "transparent",
                        color: on ? S.text : S.muted,
                      }}
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <p
                className="mb-1 mt-3 px-2 text-[11px] font-semibold tracking-wide uppercase"
                style={{ color: S.muted }}
              >
                Games
              </p>
              <nav className="flex flex-col gap-0.5">
                {GAMES.map((item) => {
                  const Icon = item.icon;
                  const on = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActive(item.id)}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left"
                      style={{
                        background: on ? S.elev : "transparent",
                        color: on ? S.text : S.muted,
                      }}
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div
              className="flex shrink-0 items-center gap-1 border-t px-2 py-2"
              style={{ borderColor: S.elev }}
            >
              <button
                type="button"
                className="rounded-md px-2 py-1.5 text-[11px] font-semibold"
                style={{ color: S.muted }}
              >
                English
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md"
                style={{ color: S.muted }}
              >
                <Monitor className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md"
                style={{ color: S.muted }}
              >
                <CircleHelp className="size-4" />
              </button>
              <button
                type="button"
                className="ml-auto flex size-8 items-center justify-center rounded-md"
                style={{ color: S.muted }}
              >
                <Users className="size-4" />
              </button>
            </div>
          </aside>
        )}

        <main className="relative min-h-0 flex-1" style={{ background: S.bg }}>
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ color: S.muted }}
          >
            <div className="max-w-sm px-4 text-center">
              <p className="text-[12px]">Empty stage · shell only</p>
              <p className="mt-1 text-[10px] leading-relaxed opacity-80">
                Measured from library stills ·{" "}
                <span className="font-mono">scr-casino-lobby 9ac80c76</span> ·{" "}
                <span className="font-mono">flow-game-launch 3fa76b56</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      className="flex size-9 items-center justify-center rounded-md"
      style={{ color: S.muted }}
    >
      {children}
    </button>
  );
}
