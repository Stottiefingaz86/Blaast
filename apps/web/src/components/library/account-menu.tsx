"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Clapperboard,
  Code2,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Monitor,
  Moon,
  PlusCircle,
  Settings,
  Shield,
  Sun,
} from "lucide-react";
import { useSession } from "@/lib/library/session";
import { useAccountOptional } from "@/lib/platform/account-store";
import { cn } from "@/lib/utils";

/**
 * Mobbin-style account popover — portals above page content so sticky
 * chrome `overflow-hidden` never clips it under the library grid.
 */
export function AccountMenu({
  className,
  initial = "Y",
}: {
  className?: string;
  initial?: string;
}) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useSession();
  const account = useAccountOptional();
  const planLabel = (user?.plan ?? account?.plan ?? "free").toUpperCase();
  // Server session only — never trust demo localStorage for admin
  const isAdmin = user?.role === "owner" || user?.role === "admin";
  const displayName = user?.name ?? account?.self?.name ?? "You";
  const displayEmail = user?.email ?? account?.self?.email ?? "signed out";
  const roleLabel =
    user?.role === "owner" ? "Owner" : user?.role === "admin" ? "Admin" : null;
  const initialLetter = (displayName || displayEmail || "Y")
    .trim()
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setPos({
      top: r.bottom + 10,
      right: Math.max(8, window.innerWidth - r.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open &&
    mounted &&
    pos &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        style={{ top: pos.top, right: pos.right }}
        className={cn(
          "fixed z-[200] w-[280px] overflow-hidden",
          "rounded-[18px] bg-[#1a1a1a] text-[#f5f5f5]",
          "shadow-[0_24px_80px_-12px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.08]",
          "animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right",
        )}
      >
        <div className="border-b border-white/[0.06] px-4 pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex rounded-md bg-[#f5f5f5] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-[#111]">
              {planLabel}
            </span>
            {roleLabel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-400">
                <Shield className="size-2.5" strokeWidth={2.5} />
                {roleLabel}
              </span>
            )}
          </div>
          <p className="mt-2 text-[14px] font-semibold tracking-tight">
            {displayName}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-[#8a8a8a]">
            {displayEmail}
          </p>
          <Link
            href="/settings/account"
            onClick={() => setOpen(false)}
            className="mt-3 flex h-9 w-full items-center justify-center rounded-full border border-white/[0.12] text-[13px] font-medium transition-colors hover:bg-white/[0.06]"
          >
            Set up profile
          </Link>
        </div>

        {isAdmin && (
          <div className="border-b border-white/[0.06] py-1.5">
            <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold tracking-wide text-[#636363] uppercase">
              Admin access
            </p>
            <MenuLink
              href="/admin"
              icon={<LayoutDashboard className="size-4" strokeWidth={1.75} />}
              onClick={() => setOpen(false)}
              badge="Admin"
            >
              Capture desk
            </MenuLink>
            <MenuLink
              href="/admin/operators"
              icon={<Clapperboard className="size-4" strokeWidth={1.75} />}
              onClick={() => setOpen(false)}
            >
              Operators & sessions
            </MenuLink>
            <MenuLink
              href="/admin/users"
              icon={<Shield className="size-4" strokeWidth={1.75} />}
              onClick={() => setOpen(false)}
            >
              Users & plans
            </MenuLink>
            <MenuLink
              href="/admin/analytics"
              icon={<Code2 className="size-4" strokeWidth={1.75} />}
              onClick={() => setOpen(false)}
            >
              Data & analytics
            </MenuLink>
          </div>
        )}

        <div className="border-b border-white/[0.06] py-1.5">
          <MenuLink
            href="/settings/mcp"
            icon={<Code2 className="size-4" strokeWidth={1.75} />}
            onClick={() => setOpen(false)}
          >
            MCP
          </MenuLink>
          <MenuLink
            href="/library"
            icon={<PlusCircle className="size-4" strokeWidth={1.75} />}
            onClick={() => setOpen(false)}
          >
            Request content
          </MenuLink>
          <MenuLink
            href="/settings/preferences"
            icon={<MessageCircle className="size-4" strokeWidth={1.75} />}
            onClick={() => setOpen(false)}
          >
            Give feedback
          </MenuLink>
          <MenuLink
            href="/settings/account"
            icon={<Settings className="size-4" strokeWidth={1.75} />}
            onClick={() => setOpen(false)}
          >
            Settings
          </MenuLink>
        </div>

        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">AI usage</span>
            <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-[#8a8a8a]">
              BETA
            </span>
          </div>
          <p className="mt-1.5 text-[12px] text-[#8a8a8a]">
            <span className="underline decoration-white/20 underline-offset-2">
              Normal
            </span>
            <span className="mx-1.5">·</span>
            Resets Dec 11
          </p>
        </div>

        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <span className="text-[13px] font-medium">Theme</span>
          <div className="flex h-8 items-center rounded-full bg-[#111] p-0.5 ring-1 ring-white/[0.06]">
            {(
              [
                ["light", Sun],
                ["dark", Moon],
                ["system", Monitor],
              ] as const
            ).map(([id, Icon]) => (
              <button
                key={id}
                type="button"
                aria-label={`Theme ${id}`}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full transition-colors",
                  theme === id
                    ? "bg-[#2a2a2a] text-white"
                    : "text-[#636363] hover:text-[#cfcfcf]",
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-white/[0.06] py-1.5">
          <MenuLink href="/pricing" onClick={() => setOpen(false)}>
            Pricing
          </MenuLink>
          <MenuLink href="/mcp" onClick={() => setOpen(false)}>
            Changelog
          </MenuLink>
          <MenuLink
            href="https://blaast.app"
            external
            onClick={() => setOpen(false)}
          >
            Support
          </MenuLink>
        </div>

        <div className="border-b border-white/[0.06] py-1.5">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout().then(() => {
                window.location.href = "/";
              });
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#f5f5f5] transition-colors hover:bg-white/[0.05]"
          >
            <LogOut className="size-4 opacity-70" strokeWidth={1.75} />
            Log out
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 text-[11px] text-[#636363]">
          <span>Privacy</span>
          <span>Terms</span>
          <span className="ml-auto text-[13px] font-semibold">𝕏</span>
        </div>
      </div>,
      document.body,
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white transition-transform hover:scale-105"
      >
        {initialLetter || initial}
      </button>
      {menu}
    </div>
  );
}

function MenuLink({
  href,
  children,
  icon,
  external,
  badge,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  external?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-[#cfcfcf] transition-colors hover:bg-white/[0.05] hover:text-white";

  const inner = (
    <>
      {icon && <span className="opacity-60">{icon}</span>}
      <span className="flex-1">{children}</span>
      {badge && (
        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
          {badge}
        </span>
      )}
      {external && (
        <ArrowUpRight className="size-3.5 opacity-40" strokeWidth={1.75} />
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        role="menuitem"
        onClick={onClick}
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} role="menuitem" onClick={onClick} className={className}>
      {inner}
    </Link>
  );
}
