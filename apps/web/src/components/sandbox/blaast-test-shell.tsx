"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  ExternalLink,
  Flame,
  Gift,
  Globe,
  Handshake,
  Heart,
  Home,
  Lightbulb,
  ListChecks,
  Menu,
  Monitor,
  Newspaper,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";

/**
 * Exact chrome from Blaast Stake clips (not memory):
 *   ui-side-nav 23efa99e… · ui-tab-bar 5e71bebc… · lobby mid-frames
 * Measured: page #12171a · side #191f24 · row hover/active #212a2f–#25292f
 *           muted #b1bad3 · register #1475e1 · header icons in pill #191f24
 */

const S = {
  bg: "#12171a",
  side: "#191f24",
  row: "#212a2f",
  hover: "#25292f",
  muted: "#b1bad3",
  text: "#ffffff",
  blue: "#1475e1",
  signIn: "#2f3a40",
} as const;

const MY_CASINO = [
  { id: "home", label: "Casino Home", icon: "casino" as const },
  { id: "saved", label: "Saved Games", icon: "saved" as const },
  { id: "following", label: "Following", icon: Heart },
  { id: "continue", label: "Continue Playing", icon: Play },
  { id: "foryou", label: "Games For You", icon: Sparkles },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "bets", label: "My Bets", icon: ListChecks },
  { id: "challenges", label: "Challenges", icon: "flag" as const },
] as const;

const GAMES = [
  { id: "only", label: "Only on Stake", icon: "s" as const },
  { id: "new", label: "New Releases", icon: Sparkles },
  { id: "slots", label: "Slots", icon: "777" as const },
  { id: "originals", label: "Stake Originals", icon: Flame },
  { id: "live", label: "Live Casino", icon: User },
] as const;

/** Global drawer (first frames of side_nav clip) */
const GLOBAL_PRIMARY = [
  { id: "g-casino", label: "Casino", icon: "casino" as const, chevron: true },
  { id: "g-sports", label: "Sports", icon: "ball" as const, chevron: true },
] as const;

const REWARDS = [
  { id: "promo", label: "Promotions", icon: Gift, chevron: true },
  { id: "chal", label: "Challenges", icon: "flag" as const },
  { id: "vip", label: "VIP Club", icon: Trophy },
] as const;

const INSIDE = [
  { id: "aff", label: "Affiliate", icon: "nodes" as const },
  { id: "spon", label: "Sponsorships", icon: Handshake, chevron: true },
  { id: "rg", label: "Responsible Gambling", icon: ShieldCheck },
  { id: "blog", label: "Blog", icon: Newspaper },
  { id: "forum", label: "Forum", icon: "chat" as const, external: true },
] as const;

export function BlaastTestShell() {
  const [active, setActive] = useState("home");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  /** Nested My Casino (lobby mid-frames) vs global drawer (side_nav t0) */
  const [nested, setNested] = useState(true);
  const [product, setProduct] = useState<"home" | "casino" | "sports">("casino");

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[14px] antialiased"
      style={{ background: S.bg, color: S.text }}
    >
      <header className="relative z-20 flex h-[60px] shrink-0 items-center gap-3 px-3">
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setSideOpen((o) => !o)}
          className="flex size-10 items-center justify-center rounded-full transition-colors"
          style={{
            color: S.muted,
            background: hoverId === "menu" ? S.hover : "transparent",
          }}
          onMouseEnter={() => setHoverId("menu")}
          onMouseLeave={() => setHoverId(null)}
        >
          <Menu className="size-[20px]" strokeWidth={2} />
        </button>

        {/* Product switcher — measured pill on #191f24 */}
        <div
          className="flex items-center gap-0.5 rounded-full p-1"
          style={{ background: S.side }}
        >
          <RailIcon
            title="Home"
            active={product === "home"}
            onClick={() => {
              setProduct("home");
              setNested(false);
            }}
          >
            <Home className="size-4" strokeWidth={2.25} />
          </RailIcon>
          <RailIcon
            title="Casino"
            active={product === "casino"}
            onClick={() => {
              setProduct("casino");
              setNested(true);
            }}
          >
            <CardIcon />
          </RailIcon>
          <RailIcon
            title="Sports"
            active={product === "sports"}
            onClick={() => {
              setProduct("sports");
              setNested(false);
            }}
          >
            <BasketballIcon />
          </RailIcon>
        </div>

        <span
          className="ml-1 select-none text-[26px] leading-none tracking-tight"
          style={{
            fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
            fontWeight: 600,
          }}
        >
          Blaast
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="h-10 rounded-md px-4 text-[14px] font-semibold transition-colors"
            style={{ background: S.signIn, color: S.text }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = S.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = S.signIn;
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className="h-10 rounded-md px-4 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: S.blue }}
          >
            Register
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-0 px-2 pb-2">
        {sideOpen && (
          <aside
            className="flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[12px]"
            style={{ background: S.side }}
          >
            {nested ? (
              <>
                <button
                  type="button"
                  onClick={() => setNested(false)}
                  className="mx-2 mt-2 flex h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-left text-[15px] font-semibold transition-colors"
                  style={{
                    color: S.text,
                    background: hoverId === "back" ? S.hover : "transparent",
                  }}
                  onMouseEnter={() => setHoverId("back")}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <ChevronLeft className="size-4" style={{ color: S.muted }} />
                  Casino
                </button>

                <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1">
                  <SectionLabel>My Casino</SectionLabel>
                  <nav className="flex flex-col gap-0.5">
                    {MY_CASINO.map((item) => (
                      <NavRow
                        key={item.id}
                        label={item.label}
                        on={active === item.id}
                        hovered={hoverId === item.id}
                        onEnter={() => setHoverId(item.id)}
                        onLeave={() => setHoverId(null)}
                        onClick={() => setActive(item.id)}
                      >
                        <RowIcon kind={item.icon} />
                      </NavRow>
                    ))}
                  </nav>

                  <SectionLabel className="mt-3">Games</SectionLabel>
                  <nav className="flex flex-col gap-0.5">
                    {GAMES.map((item) => (
                      <NavRow
                        key={item.id}
                        label={item.label}
                        on={active === item.id}
                        hovered={hoverId === item.id}
                        onEnter={() => setHoverId(item.id)}
                        onLeave={() => setHoverId(null)}
                        onClick={() => setActive(item.id)}
                      >
                        <RowIcon kind={item.icon} />
                      </NavRow>
                    ))}
                  </nav>
                </div>
              </>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1 pt-2">
                <nav className="flex flex-col gap-0.5">
                  {GLOBAL_PRIMARY.map((item) => (
                    <NavRow
                      key={item.id}
                      label={item.label}
                      on={false}
                      hovered={hoverId === item.id}
                      chevron
                      onEnter={() => setHoverId(item.id)}
                      onLeave={() => setHoverId(null)}
                      onClick={() => {
                        if (item.id === "g-casino") {
                          setNested(true);
                          setProduct("casino");
                        } else {
                          setProduct("sports");
                        }
                      }}
                    >
                      <RowIcon kind={item.icon} />
                    </NavRow>
                  ))}
                </nav>
                <SectionLabel className="mt-3">Rewards</SectionLabel>
                <nav className="flex flex-col gap-0.5">
                  {REWARDS.map((item) => (
                    <NavRow
                      key={item.id}
                      label={item.label}
                      on={false}
                      hovered={hoverId === item.id}
                      chevron={"chevron" in item && item.chevron}
                      onEnter={() => setHoverId(item.id)}
                      onLeave={() => setHoverId(null)}
                      onClick={() => undefined}
                    >
                      <RowIcon kind={item.icon} />
                    </NavRow>
                  ))}
                </nav>
                <SectionLabel className="mt-3">Inside Stake</SectionLabel>
                <nav className="flex flex-col gap-0.5">
                  {INSIDE.map((item) => (
                    <NavRow
                      key={item.id}
                      label={item.label}
                      on={false}
                      hovered={hoverId === item.id}
                      chevron={"chevron" in item && item.chevron}
                      external={"external" in item && item.external}
                      onEnter={() => setHoverId(item.id)}
                      onLeave={() => setHoverId(null)}
                      onClick={() => undefined}
                    >
                      <RowIcon kind={item.icon} />
                    </NavRow>
                  ))}
                </nav>
              </div>
            )}

            <div
              className="flex shrink-0 items-center gap-0.5 border-t px-2 py-2"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  color: S.muted,
                  background: hoverId === "lang" ? S.hover : "transparent",
                }}
                onMouseEnter={() => setHoverId("lang")}
                onMouseLeave={() => setHoverId(null)}
              >
                <Globe className="size-3.5" />
                English
                <ChevronDown className="size-3 opacity-60" />
              </button>
              <button
                type="button"
                className="ml-auto flex size-8 items-center justify-center rounded-md"
                style={{
                  color: S.muted,
                  background: hoverId === "desk" ? S.hover : "transparent",
                }}
                onMouseEnter={() => setHoverId("desk")}
                onMouseLeave={() => setHoverId(null)}
              >
                <Monitor className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md"
                style={{
                  color: S.muted,
                  background: hoverId === "help" ? S.hover : "transparent",
                }}
                onMouseEnter={() => setHoverId("help")}
                onMouseLeave={() => setHoverId(null)}
              >
                <CircleHelp className="size-4" />
              </button>
            </div>
          </aside>
        )}

        <main className="relative min-h-0 flex-1" style={{ background: S.bg }}>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-center text-[12px]" style={{ color: S.muted }}>
              Empty stage · chrome from{" "}
              <span className="font-mono text-[10px] opacity-80">
                ui-side-nav / ui-tab-bar
              </span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mb-1 px-2.5 text-[11px] font-semibold ${className}`}
      style={{ color: S.muted }}
    >
      {children}
    </p>
  );
}

function NavRow({
  children,
  label,
  on,
  hovered,
  chevron,
  external,
  onEnter,
  onLeave,
  onClick,
}: {
  children: ReactNode;
  label: string;
  on: boolean;
  hovered: boolean;
  chevron?: boolean;
  external?: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const bg = on || hovered ? (on ? S.row : S.hover) : "transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left transition-[background-color] duration-100"
      style={{ background: bg, color: S.text }}
    >
      <span
        className="flex size-[18px] shrink-0 items-center justify-center"
        style={{ color: on ? S.text : S.muted }}
      >
        {children}
      </span>
      <span className="flex-1 truncate text-[13px] font-medium leading-none">
        {label}
      </span>
      {chevron && (
        <ChevronLeft
          className="size-3.5 rotate-180 opacity-50"
          style={{ color: S.muted }}
        />
      )}
      {external && (
        <ExternalLink className="size-3 opacity-50" style={{ color: S.muted }} />
      )}
    </button>
  );
}

function RailIcon({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full transition-colors"
      style={{
        background: active ? S.row : "transparent",
        color: active ? S.text : S.muted,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = S.hover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function RowIcon({
  kind,
}: {
  kind:
    | "casino"
    | "saved"
    | "flag"
    | "s"
    | "777"
    | "ball"
    | "nodes"
    | "chat"
    | typeof Heart
    | typeof Play
    | typeof Sparkles
    | typeof Lightbulb
    | typeof ListChecks
    | typeof Flame
    | typeof User
    | typeof Gift
    | typeof Trophy
    | typeof Handshake
    | typeof ShieldCheck
    | typeof Newspaper;
}) {
  if (typeof kind !== "string") {
    const Icon = kind;
    return <Icon className="size-[16px]" strokeWidth={1.75} />;
  }
  if (kind === "casino") return <CardIcon />;
  if (kind === "ball") return <BasketballIcon />;
  if (kind === "saved") {
    return (
      <span className="relative inline-flex size-4">
        <span className="absolute inset-0 rounded-[2px] border border-current opacity-70" />
        <Heart className="absolute -right-0.5 -top-0.5 size-2.5 fill-current" />
      </span>
    );
  }
  if (kind === "flag") {
    return (
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
        <path
          d="M3 14V3.5h.5l1.2 1.8L6 3.5h5.5v6H6.2L4.8 7.5 3.5 9.5H3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "s") {
    return (
      <span className="text-[11px] font-bold leading-none tracking-tighter">
        S
      </span>
    );
  }
  if (kind === "777") {
    return (
      <span className="text-[9px] font-bold leading-none tracking-tighter">
        777
      </span>
    );
  }
  if (kind === "nodes") {
    return (
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
        <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="12" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.2 5.2 7 10.5M10.8 5.2 9 10.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (kind === "chat") {
    return (
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
        <path
          d="M3 3.5h10v7H7l-2.5 2v-2H3v-7Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}

function CardIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
      <rect
        x="3"
        y="2"
        width="10"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8 6.2c-.7-.9-2-.5-2 .6 0 1.4 2 2.6 2 2.6s2-1.2 2-2.6c0-1.1-1.3-1.5-2-.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BasketballIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 2.5v11M2.5 8h11M4 4c2 2 6 2 8 0M4 12c2-2 6-2 8 0"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}
