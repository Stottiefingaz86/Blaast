"use client";

import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Gift,
  Globe,
  Handshake,
  Headphones,
  Home,
  Menu,
  Monitor,
  PanelRight,
  Search,
  ShieldCheck,
  Trophy,
  User,
  Wallet,
} from "lucide-react";

/**
 * Chrome from Stake stills (user refs + ui-side-nav).
 * Header = 3 columns: left chrome | CENTER wallet | right utilities.
 * Side = global drawer; collapse animates width.
 */

const S = {
  bg: "#12171a",
  side: "#1a1f25",
  pill: "#1a1f25",
  hover: "#2f353d",
  active: "#2f353d",
  muted: "#b1bad3",
  text: "#ffffff",
  blue: "#1475e1",
  tether: "#26a17b",
} as const;

const PRIMARY = [
  { id: "casino", label: "Casino", icon: "card" as const, chevron: true },
  { id: "sports", label: "Sports", icon: "ball" as const, chevron: true },
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
  { id: "blog", label: "Blog", icon: "doc" as const },
  { id: "forum", label: "Forum", icon: "chat" as const, external: true },
] as const;

export function BlaastTestShell() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [product, setProduct] = useState<"home" | "casino" | "sports">("home");

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[14px] antialiased"
      style={{ background: S.bg, color: S.text }}
    >
      <header
        className="relative z-20 grid h-[60px] shrink-0 items-center px-3"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        {/* LEFT — product rail + logo */}
        <div className="flex min-w-0 items-center gap-3 justify-self-start">
          <div
            className="flex items-center gap-0.5 rounded-full p-1"
            style={{ background: S.pill }}
          >
            <IconBtn
              label="Menu"
              hot={hoverId === "menu"}
              onEnter={() => setHoverId("menu")}
              onLeave={() => setHoverId(null)}
              onClick={() => setSideOpen((o) => !o)}
            >
              <Menu className="size-[18px]" strokeWidth={2} />
            </IconBtn>
            <RailIcon
              title="Home"
              active={product === "home"}
              onClick={() => setProduct("home")}
            >
              <Home className="size-4" strokeWidth={2.25} />
            </RailIcon>
            <RailIcon
              title="Casino"
              active={product === "casino"}
              onClick={() => setProduct("casino")}
            >
              <CardIcon />
            </RailIcon>
            <RailIcon
              title="Sports"
              active={product === "sports"}
              onClick={() => setProduct("sports")}
            >
              <BallIcon />
            </RailIcon>
          </div>
          <span
            className="select-none text-[26px] leading-none tracking-tight"
            style={{
              fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
              fontWeight: 600,
            }}
          >
            Blaast
          </span>
        </div>

        {/* CENTER — balance pill + wallet (Stake shape) */}
        <div className="flex items-center justify-self-center">
          <div className="flex items-center">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-l-md rounded-r-none pl-3 pr-2 transition-colors"
              style={{ background: S.pill }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = S.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = S.pill;
              }}
            >
              <span
                className="flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold leading-none"
                style={{ background: S.tether, color: "#fff" }}
                aria-hidden
              >
                ₮
              </span>
              <span className="text-[13px] font-semibold tabular-nums tracking-tight">
                0.00000000
              </span>
              <ChevronDown
                className="size-3.5"
                style={{ color: S.muted }}
                strokeWidth={2.5}
              />
            </button>
            <button
              type="button"
              title="Wallet"
              className="flex size-10 items-center justify-center rounded-r-md rounded-l-none transition-opacity hover:opacity-90"
              style={{ background: S.blue }}
            >
              <Wallet className="size-4 text-white" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* RIGHT — utilities */}
        <div className="flex items-center gap-0.5 justify-self-end">
          {(
            [
              ["search", Search, "Search"],
              ["bell", Bell, "Notifications"],
              ["user", User, "Account"],
              ["panel", PanelRight, "Chat panel"],
            ] as const
          ).map(([id, Icon, label]) => (
            <IconBtn
              key={id}
              label={label}
              hot={hoverId === id}
              onEnter={() => setHoverId(id)}
              onLeave={() => setHoverId(null)}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} />
            </IconBtn>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-0 px-2 pb-2">
        <aside
          className="flex shrink-0 flex-col overflow-hidden"
          style={{
            width: sideOpen ? 240 : 0,
            opacity: sideOpen ? 1 : 0,
            transition:
              "width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 160ms ease",
            pointerEvents: sideOpen ? "auto" : "none",
          }}
          aria-hidden={!sideOpen}
        >
          <div
            className="flex h-full w-[240px] flex-col overflow-hidden rounded-[16px]"
            style={{ background: S.side }}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1 pt-2">
              <nav className="flex flex-col gap-0.5">
                {PRIMARY.map((item) => (
                  <NavRow
                    key={item.id}
                    label={item.label}
                    hovered={hoverId === item.id}
                    chevron
                    onEnter={() => setHoverId(item.id)}
                    onLeave={() => setHoverId(null)}
                    onClick={() =>
                      setProduct(item.id === "casino" ? "casino" : "sports")
                    }
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
                    hovered={hoverId === item.id}
                    chevron={"chevron" in item && !!item.chevron}
                    onEnter={() => setHoverId(item.id)}
                    onLeave={() => setHoverId(null)}
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
                    hovered={hoverId === item.id}
                    chevron={"chevron" in item && !!item.chevron}
                    external={"external" in item && !!item.external}
                    onEnter={() => setHoverId(item.id)}
                    onLeave={() => setHoverId(null)}
                  >
                    <RowIcon kind={item.icon} />
                  </NavRow>
                ))}
              </nav>
            </div>

            <div
              className="flex shrink-0 items-center gap-0.5 border-t px-2 py-2"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium"
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
                <Headphones className="size-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="relative min-h-0 flex-1" style={{ background: S.bg }}>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-center text-[12px]" style={{ color: S.muted }}>
              Empty stage · wallet centered · side collapses 200ms
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
  hovered,
  chevron,
  external,
  onEnter,
  onLeave,
  onClick,
}: {
  children: ReactNode;
  label: string;
  hovered: boolean;
  chevron?: boolean;
  external?: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left transition-[background-color] duration-75"
      style={{
        background: hovered ? S.hover : "transparent",
        color: S.text,
      }}
    >
      <span
        className="flex size-[18px] shrink-0 items-center justify-center"
        style={{ color: hovered ? S.text : S.muted }}
      >
        {children}
      </span>
      <span className="flex-1 truncate text-[13px] font-medium leading-none">
        {label}
      </span>
      {chevron && (
        <ChevronRight
          className="size-3.5 opacity-50"
          style={{ color: S.muted }}
        />
      )}
      {external && (
        <ExternalLink
          className="size-3 opacity-50"
          style={{ color: S.muted }}
        />
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
        background: active ? S.active : "transparent",
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

function IconBtn({
  children,
  label,
  hot,
  onEnter,
  onLeave,
  onClick,
}: {
  children: ReactNode;
  label: string;
  hot: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex size-9 items-center justify-center rounded-full transition-colors"
      style={{
        color: S.muted,
        background: hot ? S.hover : "transparent",
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
    | "card"
    | "ball"
    | "flag"
    | "nodes"
    | "doc"
    | "chat"
    | typeof Gift
    | typeof Trophy
    | typeof Handshake
    | typeof ShieldCheck;
}) {
  if (typeof kind !== "string") {
    const Icon = kind;
    return <Icon className="size-4" strokeWidth={1.75} />;
  }
  if (kind === "card") return <CardIcon />;
  if (kind === "ball") return <BallIcon />;
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
  if (kind === "nodes") {
    return (
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
        <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="12" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path
          d="M5.2 5.2 7 10.5M10.8 5.2 9 10.5"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
    );
  }
  if (kind === "doc") {
    return (
      <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
        <path
          d="M4 2.5h5.5L12 5v8.5H4v-11Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M9.5 2.5V5H12" stroke="currentColor" strokeWidth="1.3" />
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

function BallIcon() {
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
