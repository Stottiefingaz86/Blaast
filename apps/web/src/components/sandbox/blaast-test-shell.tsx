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
  PanelLeftClose,
  PanelRight,
  Search,
  ShieldCheck,
  Trophy,
  User,
  Wallet,
} from "lucide-react";

/**
 * Stake chrome from collapsed still 78b4c030 + open side_nav.
 * CLOSED = icon rail (~64px), NOT width:0 empty void.
 * Top rail (menu/home/card/ball) sits in header when open;
 * when collapsed it becomes the vertical top pill on the rail.
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
  rail: 64,
  open: 240,
} as const;

type Product = "home" | "casino" | "sports";

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
  const [product, setProduct] = useState<Product>("home");

  return (
    <div
      className="flex h-screen flex-col overflow-hidden text-[14px] antialiased"
      style={{ background: S.bg, color: S.text }}
    >
      <header
        className="relative z-20 grid h-[60px] shrink-0 items-center px-3"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        <div className="flex min-w-0 items-center gap-3 justify-self-start">
          {/* Product pill lives in header only when side is OPEN (Stake). */}
          {sideOpen ? (
            <div
              className="flex items-center gap-0.5 rounded-full p-1"
              style={{ background: S.pill }}
            >
              <IconBtn
                label="Collapse side nav"
                hot={hoverId === "menu"}
                onEnter={() => setHoverId("menu")}
                onLeave={() => setHoverId(null)}
                onClick={() => setSideOpen(false)}
              >
                <Menu className="size-[18px]" strokeWidth={2} />
              </IconBtn>
              <ProductRail
                product={product}
                setProduct={setProduct}
                hoverId={hoverId}
                setHoverId={setHoverId}
              />
            </div>
          ) : null}
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

        <div className="flex items-center justify-self-center">
          <div className="flex items-center">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-l-md pl-3 pr-2 transition-colors"
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
              className="flex size-10 items-center justify-center rounded-r-md transition-opacity hover:opacity-90"
              style={{ background: S.blue }}
            >
              <Wallet className="size-4 text-white" strokeWidth={2.25} />
            </button>
          </div>
        </div>

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

      <div className="flex min-h-0 flex-1 px-2 pb-2">
        <aside
          className="flex shrink-0 flex-col"
          style={{
            width: sideOpen ? S.open : S.rail,
            transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {sideOpen ? (
            <OpenDrawer
              hoverId={hoverId}
              setHoverId={setHoverId}
              setProduct={setProduct}
            />
          ) : (
            <CollapsedRail
              product={product}
              setProduct={setProduct}
              hoverId={hoverId}
              setHoverId={setHoverId}
              onExpand={() => setSideOpen(true)}
            />
          )}
        </aside>

        <main className="relative min-h-0 flex-1" style={{ background: S.bg }}>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-center text-[12px]" style={{ color: S.muted }}>
              Empty stage · collapse = icon rail (not hide)
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Full labeled drawer — items start at top of panel (no empty header gap). */
function OpenDrawer({
  hoverId,
  setHoverId,
  setProduct,
}: {
  hoverId: string | null;
  setHoverId: (id: string | null) => void;
  setProduct: (p: Product) => void;
}) {
  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-[16px]"
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

        <SectionLabel className="mt-3">Inside Blaast</SectionLabel>
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

      <FooterBar hoverId={hoverId} setHoverId={setHoverId} open />
    </div>
  );
}

/**
 * Collapsed icon rail from Stake still 78b4c030:
 * top pill: expand · home · card · ball
 * body pill: casino · sports · | · rewards · | · inside
 * footer icons
 */
function CollapsedRail({
  product,
  setProduct,
  hoverId,
  setHoverId,
  onExpand,
}: {
  product: Product;
  setProduct: (p: Product) => void;
  hoverId: string | null;
  setHoverId: (id: string | null) => void;
  onExpand: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center gap-2">
      <div
        className="flex w-full flex-col items-center gap-0.5 rounded-[16px] py-1.5"
        style={{ background: S.side }}
      >
        <RailIconBtn
          title="Expand"
          hot={hoverId === "expand"}
          active={false}
          onEnter={() => setHoverId("expand")}
          onLeave={() => setHoverId(null)}
          onClick={onExpand}
        >
          <PanelLeftClose className="size-4 rotate-180" strokeWidth={2} />
        </RailIconBtn>
        <ProductRail
          product={product}
          setProduct={setProduct}
          hoverId={hoverId}
          setHoverId={setHoverId}
          vertical
        />
      </div>

      <div
        className="flex min-h-0 w-full flex-1 flex-col items-center gap-0.5 overflow-y-auto rounded-[16px] py-2"
        style={{ background: S.side }}
      >
        <RailIconBtn
          title="Casino"
          hot={hoverId === "c-casino"}
          active={product === "casino"}
          onEnter={() => setHoverId("c-casino")}
          onLeave={() => setHoverId(null)}
          onClick={() => setProduct("casino")}
        >
          <CardIcon />
        </RailIconBtn>
        <RailIconBtn
          title="Sports"
          hot={hoverId === "c-sports"}
          active={product === "sports"}
          onEnter={() => setHoverId("c-sports")}
          onLeave={() => setHoverId(null)}
          onClick={() => setProduct("sports")}
        >
          <BallIcon />
        </RailIconBtn>

        <Divider />

        {REWARDS.map((item) => (
          <RailIconBtn
            key={item.id}
            title={item.label}
            hot={hoverId === `c-${item.id}`}
            active={false}
            onEnter={() => setHoverId(`c-${item.id}`)}
            onLeave={() => setHoverId(null)}
          >
            <RowIcon kind={item.icon} />
          </RailIconBtn>
        ))}

        <Divider />

        {INSIDE.filter((i) => i.id !== "forum").map((item) => (
          <RailIconBtn
            key={item.id}
            title={item.label}
            hot={hoverId === `c-${item.id}`}
            active={false}
            onEnter={() => setHoverId(`c-${item.id}`)}
            onLeave={() => setHoverId(null)}
          >
            <RowIcon kind={item.icon} />
          </RailIconBtn>
        ))}
      </div>

      <FooterBar hoverId={hoverId} setHoverId={setHoverId} open={false} />
    </div>
  );
}

function ProductRail({
  product,
  setProduct,
  hoverId,
  setHoverId,
  vertical = false,
}: {
  product: Product;
  setProduct: (p: Product) => void;
  hoverId: string | null;
  setHoverId: (id: string | null) => void;
  vertical?: boolean;
}) {
  const items = [
    { id: "home" as const, title: "Home", node: <Home className="size-4" strokeWidth={2.25} /> },
    { id: "casino" as const, title: "Casino", node: <CardIcon /> },
    { id: "sports" as const, title: "Sports", node: <BallIcon /> },
  ];
  return (
    <div className={vertical ? "flex flex-col items-center gap-0.5" : "flex items-center gap-0.5"}>
      {items.map((item) => (
        <RailIconBtn
          key={item.id}
          title={item.title}
          hot={hoverId === item.id}
          active={product === item.id}
          onEnter={() => setHoverId(item.id)}
          onLeave={() => setHoverId(null)}
          onClick={() => setProduct(item.id)}
        >
          {item.node}
        </RailIconBtn>
      ))}
    </div>
  );
}

function FooterBar({
  hoverId,
  setHoverId,
  open,
}: {
  hoverId: string | null;
  setHoverId: (id: string | null) => void;
  open: boolean;
}) {
  if (!open) {
    return (
      <div className="flex w-full flex-col items-center gap-0.5 pb-1">
        <RailIconBtn
          title="Language"
          hot={hoverId === "lang"}
          active={false}
          onEnter={() => setHoverId("lang")}
          onLeave={() => setHoverId(null)}
        >
          <Globe className="size-4" />
        </RailIconBtn>
        <RailIconBtn
          title="Display"
          hot={hoverId === "desk"}
          active={false}
          onEnter={() => setHoverId("desk")}
          onLeave={() => setHoverId(null)}
        >
          <Monitor className="size-4" />
        </RailIconBtn>
        <RailIconBtn
          title="Support"
          hot={hoverId === "help"}
          active={false}
          onEnter={() => setHoverId("help")}
          onLeave={() => setHoverId(null)}
        >
          <Headphones className="size-4" />
        </RailIconBtn>
      </div>
    );
  }

  return (
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
  );
}

function Divider() {
  return (
    <div
      className="my-1.5 w-8 shrink-0 border-t"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    />
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

function RailIconBtn({
  children,
  title,
  hot,
  active,
  onEnter,
  onLeave,
  onClick,
}: {
  children: ReactNode;
  title: string;
  hot: boolean;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="flex size-10 items-center justify-center rounded-full transition-colors"
      style={{
        background: active || hot ? S.active : "transparent",
        color: active || hot ? S.text : S.muted,
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
          d="M2.5 13.5V3l4 2.2L10.5 3v7.5L6.5 12 2.5 9.8"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
        <path d="M2.5 3v10.5" stroke="currentColor" strokeWidth="1.35" />
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
        x="3.5"
        y="2"
        width="9"
        height="12"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        d="M8 5.8c-.55-.7-1.55-.4-1.55.5 0 1.15 1.55 2.15 1.55 2.15S9.55 7.45 9.55 6.3c0-.9-1-.2-1.55.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Basketball — curved seams (not a wireframe globe). */
function BallIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M8 2.75v10.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M3.2 5.2c1.6 1.1 8 1.1 9.6 0"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M3.2 10.8c1.6-1.1 8-1.1 9.6 0"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}
