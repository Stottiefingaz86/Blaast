"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  CircleHelp,
  Dices,
  Flame,
  Gamepad2,
  Heart,
  Home,
  Joystick,
  LayoutGrid,
  MessageCircle,
  Monitor,
  Search,
  Sparkles,
  Spade,
  Target,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * /blaast-test — Stake.com shell only (empty main).
 * Still: CDN first-frame from Stake casino lobby capture
 *   poster …/9ac80c76-…png
 *   evidence ev-rec-2396e3c8-…-casino_browse
 * No Stake logo / trademarks — Blaast wordmark.
 */

const S = {
  grey900: "#0f212e",
  grey800: "#1a2c38",
  grey700: "#213743",
  grey600: "#2f4553",
  grey500: "#3d5564",
  grey400: "#557086",
  grey200: "#b1bad3",
  white: "#ffffff",
  blue: "#1475e1",
  green: "#00e701",
} as const;

const MY_CASINO = [
  { id: "home", label: "Casino Home", icon: Home },
  { id: "saved", label: "Favourites", icon: Heart },
  { id: "recent", label: "Recent", icon: LayoutGrid },
  { id: "challenges", label: "Challenges", icon: Target },
  { id: "my-bets", label: "My Bets", icon: Trophy },
] as const;

const GAMES = [
  { id: "originals", label: "Stake Originals", icon: Sparkles },
  { id: "slots", label: "Slots", icon: Joystick },
  { id: "live", label: "Live Casino", icon: Spade },
  { id: "new", label: "New Releases", icon: Flame },
  { id: "shows", label: "Game Shows", icon: Gamepad2 },
] as const;

export function BlaastTestShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [product, setProduct] = useState<"casino" | "sports">("casino");
  const [active, setActive] = useState("home");

  return (
    <div
      className="flex h-screen overflow-hidden text-[13px]"
      style={{ background: S.grey900, color: S.white }}
    >
      <aside
        className={cn(
          "flex shrink-0 flex-col transition-[width] duration-200",
          collapsed ? "w-[56px]" : "w-[240px]",
        )}
        style={{ background: S.grey800 }}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2 px-3",
            collapsed && "justify-center px-0",
          )}
        >
          <button
            type="button"
            aria-label="Collapse"
            onClick={() => setCollapsed((c) => !c)}
            className="flex size-8 items-center justify-center rounded-md"
            style={{ background: S.grey700, color: S.grey200 }}
          >
            <ChevronLeft
              className={cn("size-4 transition", collapsed && "rotate-180")}
            />
          </button>
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-tight">
              Blaast
            </span>
          )}
        </div>

        <div className={cn("px-2 pb-2", collapsed && "px-1")}>
          <div
            className={cn(
              "grid gap-0.5 rounded-md p-0.5",
              collapsed ? "grid-cols-1" : "grid-cols-2",
            )}
            style={{ background: S.grey900 }}
          >
            {(
              [
                { id: "casino" as const, label: "Casino", icon: Dices },
                { id: "sports" as const, label: "Sports", icon: Trophy },
              ] as const
            ).map((p) => {
              const Icon = p.icon;
              const on = product === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  title={p.label}
                  onClick={() => setProduct(p.id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-[5px] py-2 font-semibold",
                    collapsed ? "px-0" : "px-2",
                  )}
                  style={{
                    background: on ? S.grey600 : "transparent",
                    color: on ? S.white : S.grey200,
                  }}
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                  {!collapsed && <span>{p.label}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {!collapsed && (
            <p
              className="mb-1 px-2 pt-1 text-[11px] font-semibold tracking-wide uppercase"
              style={{ color: S.grey400 }}
            >
              Browse
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {MY_CASINO.map((item) => {
              const Icon = item.icon;
              const on = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md py-2 text-left",
                    collapsed ? "justify-center px-0" : "px-2.5",
                  )}
                  style={{
                    background: on ? S.grey600 : "transparent",
                    color: on ? S.white : S.grey200,
                  }}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="my-3 h-px" style={{ background: S.grey700 }} />

          {!collapsed && (
            <p
              className="mb-1 px-2 text-[11px] font-semibold tracking-wide uppercase"
              style={{ color: S.grey400 }}
            >
              Games
            </p>
          )}
          <nav className="flex flex-col gap-0.5">
            {GAMES.map((item) => {
              const Icon = item.icon;
              const on = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md py-2 text-left",
                    collapsed ? "justify-center px-0" : "px-2.5",
                  )}
                  style={{
                    background: on ? S.grey600 : "transparent",
                    color: on ? S.white : S.grey200,
                  }}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-1 border-t px-2 py-2",
            collapsed && "flex-col",
          )}
          style={{ borderColor: S.grey700 }}
        >
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md"
            style={{ color: S.grey200 }}
            title="Language"
          >
            <span className="text-[11px] font-semibold">EN</span>
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md"
            style={{ color: S.grey200 }}
            title="Desktop"
          >
            <Monitor className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-md"
            style={{ color: S.grey200 }}
            title="Support"
          >
            <CircleHelp className="size-4" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 shrink-0 items-center gap-3 px-3"
          style={{ background: S.grey900 }}
        >
          <div className="hidden items-center sm:flex">
            <span className="text-[15px] font-semibold tracking-tight">
              Blaast
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden h-9 items-center gap-2 rounded-md px-3 md:flex"
              style={{ background: S.grey700 }}
            >
              <span className="tabular-nums text-[12px]" style={{ color: S.grey200 }}>
                0.00
              </span>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded"
                style={{ background: S.blue, color: S.white }}
                title="Wallet"
              >
                <Wallet className="size-3.5" />
              </button>
            </div>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-md"
              style={{ background: S.grey700, color: S.grey200 }}
              title="Search"
            >
              <Search className="size-4" />
            </button>
            <button
              type="button"
              className="relative flex size-9 items-center justify-center rounded-md"
              style={{ background: S.grey700, color: S.grey200 }}
              title="Notifications"
            >
              <Bell className="size-4" />
              <span
                className="absolute right-2 top-2 size-1.5 rounded-full"
                style={{ background: S.blue }}
              />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-md"
              style={{ background: S.grey700, color: S.grey200 }}
              title="Account"
            >
              <User className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-md"
              style={{ background: S.grey700, color: S.grey200 }}
              title="Chat"
            >
              <MessageCircle className="size-4" />
            </button>
            <Link
              href="/library"
              className="ml-1 hidden text-[11px] lg:inline"
              style={{ color: S.grey400 }}
            >
              /blaast-test
            </Link>
          </div>
        </header>

        <main className="relative min-h-0 flex-1" style={{ background: S.grey900 }}>
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ color: S.grey500 }}
          >
            <div className="text-center">
              <p className="text-[12px]">Empty stage · shell only</p>
              <p className="mt-1 max-w-sm text-[10px] leading-relaxed opacity-70">
                First-frame still · Stake casino lobby ·{" "}
                <span className="font-mono">9ac80c76…</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
