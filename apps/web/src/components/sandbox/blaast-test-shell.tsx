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
  MessageSquare,
  Monitor,
  PanelRight,
  Search,
  Sparkles,
  Spade,
  Target,
  Trophy,
  User,
  Wallet,
} from "lucide-react";

/**
 * /blaast-test — shell measured from Blaast library Stake stills + user reference.
 * Evidence: ui-side-nav / scr-casino-lobby / flow-game-launch (session 2396e3c8…)
 * Empty main on purpose.
 */

const S = {
  bg: "#0f212e",
  side: "#1a2c38",
  elev: "#2f4553",
  row: "#213743",
  muted: "#b1bad3",
  text: "#ffffff",
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
  { id: "only", label: "Only on Stake", icon: Sparkles },
  { id: "new", label: "New Releases", icon: Flame },
  { id: "slots", label: "Slots", icon: Gamepad2 },
  { id: "originals", label: "Stake Originals", icon: Dices },
  { id: "live", label: "Live Casino", icon: Spade },
] as const;

export function BlaastTestShell() {
  const [active, setActive] = useState("home");
  const [sideOpen, setSideOpen] = useState(true);

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[13px]"
      style={{ background: S.bg, color: S.text, fontFamily: "system-ui, sans-serif" }}
    >
      {/* Header — measured: burger · Home/Fav/Sports · logo · wallet · utils */}
      <header className="relative z-20 flex h-[60px] shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setSideOpen((o) => !o)}
          className="flex size-9 items-center justify-center rounded-md"
          style={{ color: S.muted }}
        >
          <Menu className="size-[18px]" strokeWidth={2} />
        </button>

        <div
          className="flex items-center gap-0.5 rounded-full p-[3px]"
          style={{ background: S.side }}
        >
          <TopIcon active title="Home">
            <Home className="size-3.5" strokeWidth={2.25} />
          </TopIcon>
          <TopIcon title="Favourites">
            <FolderHeart className="size-3.5" strokeWidth={2} />
          </TopIcon>
          <TopIcon title="Sports">
            {/* Basketball — matches Stake sports icon in header rail */}
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9" />
              <path d="M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9" />
              <path d="M3.5 12h17" />
            </svg>
          </TopIcon>
        </div>

        <span
          className="ml-1 text-[22px] font-semibold tracking-tight"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          Blaast
        </span>

        <div
          className="ml-3 flex h-10 items-center gap-2 rounded-md pl-3"
          style={{ background: S.side }}
        >
          <span className="text-[12px] tabular-nums" style={{ color: S.muted }}>
            0.00000000
          </span>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md"
            style={{ background: S.blue }}
            title="Wallet"
          >
            <Wallet className="size-3.5" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <IconBtn label="Search">
            <Search className="size-[18px]" />
          </IconBtn>
          <IconBtn label="Notifications">
            <Bell className="size-[18px]" />
          </IconBtn>
          <IconBtn label="Account">
            <User className="size-[18px]" />
          </IconBtn>
          <IconBtn label="Side panel">
            <PanelRight className="size-[18px]" />
          </IconBtn>
          <Link
            href="/library"
            className="ml-2 hidden text-[11px] xl:inline"
            style={{ color: S.muted }}
          >
            /blaast-test
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 gap-0 px-0">
        {sideOpen && (
          <aside
            className="relative z-10 ml-2 mb-2 flex w-[240px] shrink-0 flex-col overflow-hidden rounded-xl"
            style={{ background: S.side }}
          >
            <button
              type="button"
              className="flex h-11 shrink-0 items-center gap-1 px-3 text-left text-[14px] font-semibold"
            >
              <ChevronLeft className="size-4" style={{ color: S.muted }} />
              Casino
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
              <p
                className="mb-1 px-2 text-[11px] font-semibold"
                style={{ color: S.muted }}
              >
                My Casino
              </p>
              <nav className="flex flex-col gap-[2px]">
                {MY_CASINO.map((item) => {
                  const Icon = item.icon;
                  const on = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActive(item.id)}
                      className="flex items-center gap-3 rounded-md px-2.5 py-[9px] text-left text-[13px]"
                      style={{
                        background: on ? S.elev : "transparent",
                        color: on ? S.text : S.muted,
                        fontWeight: on ? 600 : 500,
                      }}
                    >
                      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <p
                className="mb-1 mt-3 px-2 text-[11px] font-semibold"
                style={{ color: S.muted }}
              >
                Games
              </p>
              <nav className="flex flex-col gap-[2px]">
                {GAMES.map((item) => {
                  const Icon = item.icon;
                  const on = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActive(item.id)}
                      className="flex items-center gap-3 rounded-md px-2.5 py-[9px] text-left text-[13px]"
                      style={{
                        background: on ? S.elev : "transparent",
                        color: on ? S.text : S.muted,
                        fontWeight: on ? 600 : 500,
                      }}
                    >
                      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div
              className="flex shrink-0 items-center gap-1 border-t px-2 py-2"
              style={{ borderColor: S.row }}
            >
              <button
                type="button"
                className="rounded-md px-2 py-1.5 text-[12px] font-medium"
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
                className="ml-auto flex size-8 items-center justify-center rounded-md"
                style={{ color: S.muted }}
              >
                <CircleHelp className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md"
                style={{ color: S.muted }}
              >
                <MessageSquare className="size-4" />
              </button>
            </div>
          </aside>
        )}

        <main className="relative min-h-0 flex-1" style={{ background: S.bg }}>
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ color: S.elev }}
          >
            <div className="max-w-md px-4 text-center">
              <p className="text-[12px]" style={{ color: S.muted }}>
                Empty stage · shell only
              </p>
              <p className="mt-1 text-[10px] leading-relaxed" style={{ color: S.elev }}>
                Library evidence · ui-side-nav + scr-casino-lobby · session
                2396e3c8…
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TopIcon({
  children,
  title,
  active,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
}) {
  return (
    <span
      title={title}
      className="flex size-8 items-center justify-center rounded-full"
      style={{
        background: active ? S.elev : "transparent",
        color: active ? S.text : S.muted,
      }}
    >
      {children}
    </span>
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
