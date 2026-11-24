"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Flame,
  FolderHeart,
  Globe,
  Heart,
  Home,
  Lightbulb,
  ListChecks,
  Menu,
  Monitor,
  PanelRight,
  Play,
  Search,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";

/**
 * Exact chrome rebuild from Blaast library stills (not memory / web).
 * Evidence:
 *   lobby 9ac80c76… + side crop …-side_nav.png + header crop
 *   ui-side-nav 23efa99e… · ui-tab-bar 5e71bebc…
 * Measured page bg #12171a · side #191f24 · active #212a2f · muted #b1bad3
 */

const S = {
  bg: "#12171a",
  side: "#191f24",
  active: "#212a2f",
  hover: "#222b30",
  chrome: "#39464c",
  muted: "#b1bad3",
  text: "#ffffff",
  blue: "#1475e1",
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

export function BlaastTestShell() {
  const [active, setActive] = useState("home");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [product, setProduct] = useState<"home" | "casino" | "sports">("casino");

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[13px] antialiased"
      style={{ background: S.bg, color: S.text }}
    >
      <header className="relative z-20 flex h-[60px] shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setSideOpen((o) => !o)}
          className="flex size-9 items-center justify-center rounded-md transition-colors"
          style={{ color: S.muted }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = S.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = S.muted;
          }}
        >
          <Menu className="size-[18px]" strokeWidth={2} />
        </button>

        {/* Product rail — measured: Home · Favourites · Sports */}
        <div
          className="flex items-center gap-[2px] rounded-full p-[3px]"
          style={{ background: S.side }}
        >
          <RailIcon
            title="Home"
            active={product === "home"}
            onClick={() => setProduct("home")}
          >
            <Home className="size-3.5" strokeWidth={2.25} />
          </RailIcon>
          <RailIcon
            title="Favourites"
            active={false}
            onClick={() => undefined}
          >
            <FolderHeart className="size-3.5" strokeWidth={2} />
          </RailIcon>
          <RailIcon
            title="Sports"
            active={product === "sports"}
            onClick={() => setProduct("sports")}
          >
            <BasketballIcon />
          </RailIcon>
        </div>

        <span
          className="ml-2 select-none text-[22px] leading-none tracking-tight"
          style={{
            fontFamily:
              "ui-serif, Georgia, 'Times New Roman', Times, serif",
            fontWeight: 600,
          }}
        >
          Blaast
        </span>

        <div
          className="ml-4 flex h-10 items-center gap-2 rounded-md pl-3"
          style={{ background: S.side }}
        >
          <span
            className="text-[12px] tabular-nums"
            style={{ color: S.muted }}
          >
            0.00000000
          </span>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md transition-opacity hover:opacity-90"
            style={{ background: S.blue }}
            title="Wallet"
          >
            <Wallet className="size-3.5 text-white" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <HdrBtn label="Search">
            <Search className="size-[18px]" />
          </HdrBtn>
          <HdrBtn label="Notifications">
            <Bell className="size-[18px]" />
          </HdrBtn>
          <HdrBtn label="Account">
            <User className="size-[18px]" />
          </HdrBtn>
          <HdrBtn label="Chat panel">
            <PanelRight className="size-[18px]" />
          </HdrBtn>
          <Link
            href="/library"
            className="ml-2 hidden text-[11px] xl:inline"
            style={{ color: S.muted }}
          >
            /blaast-test
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 pl-2 pb-2">
        {sideOpen && (
          <aside
            className="flex w-[240px] shrink-0 flex-col overflow-hidden rounded-xl"
            style={{ background: S.side }}
          >
            <button
              type="button"
              className="flex h-11 shrink-0 items-center gap-1.5 px-3 text-left text-[14px] font-semibold transition-colors"
              style={{ color: S.text }}
            >
              <ChevronLeft className="size-4" style={{ color: S.muted }} />
              Casino
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1">
              <SectionLabel>My Casino</SectionLabel>
              <nav className="flex flex-col gap-[2px]">
                {MY_CASINO.map((item) => {
                  const on = active === item.id;
                  const hovered = hoverId === item.id;
                  return (
                    <NavRow
                      key={item.id}
                      label={item.label}
                      on={on}
                      hovered={hovered}
                      onEnter={() => setHoverId(item.id)}
                      onLeave={() => setHoverId(null)}
                      onClick={() => {
                        setActive(item.id);
                        setProduct("casino");
                      }}
                    >
                      <RowIcon kind={item.icon} />
                    </NavRow>
                  );
                })}
              </nav>

              <SectionLabel className="mt-3">Games</SectionLabel>
              <nav className="flex flex-col gap-[2px]">
                {GAMES.map((item) => {
                  const on = active === item.id;
                  const hovered = hoverId === item.id;
                  return (
                    <NavRow
                      key={item.id}
                      label={item.label}
                      on={on}
                      hovered={hovered}
                      onEnter={() => setHoverId(item.id)}
                      onLeave={() => setHoverId(null)}
                      onClick={() => setActive(item.id)}
                    >
                      <RowIcon kind={item.icon} />
                    </NavRow>
                  );
                })}
              </nav>
            </div>

            <div
              className="flex shrink-0 items-center gap-1 border-t px-2 py-2"
              style={{ borderColor: S.active }}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors"
                style={{ color: S.muted }}
              >
                <Globe className="size-3.5" />
                English
                <ChevronDown className="size-3 opacity-60" />
              </button>
              <button
                type="button"
                className="ml-auto flex size-8 items-center justify-center rounded-md"
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
            </div>
          </aside>
        )}

        <main className="relative min-h-0 flex-1" style={{ background: S.bg }}>
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ color: S.active }}
          >
            <p className="text-center text-[12px]" style={{ color: S.muted }}>
              Empty stage · shell from lobby still{" "}
              <span className="font-mono text-[10px] opacity-70">
                9ac80c76 / side_nav crop
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
  onEnter,
  onLeave,
  onClick,
}: {
  children: ReactNode;
  label: string;
  on: boolean;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const bg = on ? S.active : hovered ? S.hover : "transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex w-full items-center gap-3 rounded-md px-2.5 py-[9px] text-left text-[13px] transition-colors duration-100"
      style={{
        background: bg,
        color: on || hovered ? S.text : S.muted,
        fontWeight: on ? 600 : 500,
      }}
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center">
        {children}
      </span>
      <span className="truncate">{label}</span>
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
    | typeof Heart
    | typeof Play
    | typeof Sparkles
    | typeof Lightbulb
    | typeof ListChecks
    | typeof Flame
    | typeof User;
}) {
  if (kind === "casino") {
    return (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 12h.01M12 8v8M16 12h.01" />
      </svg>
    );
  }
  if (kind === "saved") {
    return (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M7 4h10v16l-5-3-5 3V4z" />
      </svg>
    );
  }
  if (kind === "flag") {
    return (
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M6 3v18M6 4c4 2 6-1 10 1v8c-4-2-6 1-10-1" />
      </svg>
    );
  }
  if (kind === "s") {
    return <span className="text-[12px] font-bold leading-none">S</span>;
  }
  if (kind === "777") {
    return <span className="text-[9px] font-bold leading-none tracking-tighter">777</span>;
  }
  const Icon = kind;
  return <Icon className="size-[18px]" strokeWidth={1.75} />;
}

function RailIcon({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full transition-colors duration-100"
      style={{
        background: active ? S.active : "transparent",
        color: active ? S.text : S.muted,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = S.text;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = S.muted;
      }}
    >
      {children}
    </button>
  );
}

function HdrBtn({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      title={label}
      className="flex size-9 items-center justify-center rounded-md transition-colors duration-100"
      style={{ color: S.muted }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = S.text;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = S.muted;
      }}
    >
      {children}
    </button>
  );
}

function BasketballIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9M3.5 12h17" />
    </svg>
  );
}
