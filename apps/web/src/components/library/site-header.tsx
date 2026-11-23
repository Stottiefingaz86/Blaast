"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Bookmark,
  Globe,
  Library,
  Megaphone,
  MessageSquareQuote,
  Monitor,
  Palette,
  Scale,
  Search,
  Smartphone,
  PenTool,
  WandSparkles,
  Waypoints,
} from "lucide-react";
import { BlaastMark } from "@/components/brand/blaast-mark";
import { AccountMenu } from "@/components/library/account-menu";
import { useSession } from "@/lib/library/session";
import { useAccountOptional } from "@/lib/platform/account-store";
import { cn } from "@/lib/utils";
import type { DiscoverTab } from "@/lib/library/taxonomy-nav";

type NavCard = {
  label: string;
  href: string;
  icon: ReactNode;
};

const LIBRARY_MENU: NavCard[] = [
  {
    label: "Mobile",
    href: "/library?platform=mobile",
    icon: <Smartphone className="size-6" strokeWidth={1.6} />,
  },
  {
    label: "Desktop",
    href: "/library?platform=web",
    icon: <Monitor className="size-6" strokeWidth={1.6} />,
  },
];

const RESEARCH_MENU: NavCard[] = [
  {
    label: "Journey Audit",
    href: "/research?tool=journey-audit",
    icon: <Waypoints className="size-6" strokeWidth={1.6} />,
  },
  {
    label: "Voice of Customer",
    href: "/research?tool=voc",
    icon: <MessageSquareQuote className="size-6" strokeWidth={1.6} />,
  },
  {
    label: "Marketing Analysis",
    href: "/research?tool=marketing",
    icon: <Megaphone className="size-6" strokeWidth={1.6} />,
  },
  {
    label: "Benchmark",
    href: "/research?tool=benchmark",
    icon: <Scale className="size-6" strokeWidth={1.6} />,
  },
];

const STUDIO_MENU: NavCard[] = [
  {
    label: "Prototype",
    href: "/studio",
    icon: <PenTool className="size-6" strokeWidth={1.6} />,
  },
  {
    label: "Design system",
    href: "/studio",
    icon: <Palette className="size-6" strokeWidth={1.6} />,
  },
];

/** Main library chrome — Mobbin: logo · tabs · search · icons · invite · avatar */
export function SiteHeader({
  tab = "library",
  searchPlaceholder = "Search operators…",
  onSearchOpen,
  className,
}: {
  tab?: DiscoverTab;
  searchPlaceholder?: string;
  /** Opens Mobbin-style browse / filter modal */
  onSearchOpen?: () => void;
  className?: string;
}) {
  const { loggedIn } = useSession();
  const account = useAccountOptional();
  const isAdmin = Boolean(account?.isAdmin);

  return (
    <div
      className={cn(
        "mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-5",
        className,
      )}
    >
      <Link href="/library" className="mr-5 flex shrink-0 items-center sm:mr-7">
        <BlaastMark className="h-7" />
      </Link>

      <nav className="hidden items-center gap-1 md:flex">
        <HoverNav
          href="/library"
          active={tab === "library"}
          label="Library"
          icon={<Library className="size-3.5" strokeWidth={1.75} />}
          items={LIBRARY_MENU}
          columns={2}
        />
        <HoverNav
          href="/research"
          active={tab === "research"}
          label="Research"
          icon={<Waypoints className="size-3.5" strokeWidth={1.75} />}
          items={RESEARCH_MENU}
          columns={2}
          comingSoon
        />
        <HoverNav
          href="/studio"
          active={tab === "studio"}
          label="Studio"
          icon={<WandSparkles className="size-3.5" strokeWidth={1.75} />}
          items={STUDIO_MENU}
          columns={2}
          comingSoon
        />
      </nav>

      <div className="relative mx-auto flex w-full max-w-xl flex-1 items-center">
        <button
          type="button"
          onClick={onSearchOpen}
          className="lib-search flex h-10 w-full items-center gap-2 rounded-full px-4 text-left text-[#8a8a8a] transition-colors hover:bg-white/[0.04]"
        >
          <Search className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate text-[13px] text-[#636363]">
            {searchPlaceholder}
          </span>
          <kbd className="ml-auto hidden rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-[#636363] sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconBtn label="Saved">
          <Bookmark className="size-4" strokeWidth={1.75} />
        </IconBtn>
        {loggedIn && (
          <>
            <IconBtn label="Explore">
              <Globe className="size-4" strokeWidth={1.75} />
            </IconBtn>
            <IconBtn label="Notifications">
              <Bell className="size-4" strokeWidth={1.75} />
            </IconBtn>
            {isAdmin && (
              <Link
                href="/admin"
                className="ml-1 hidden h-8 items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 text-[12px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 sm:inline-flex"
              >
                Admin
              </Link>
            )}
            <Link
              href="/settings/billing"
              className="ml-1 hidden h-8 items-center rounded-full border border-white/[0.12] px-3 text-[12px] font-medium text-[#cfcfcf] transition-colors hover:bg-white/[0.05] sm:inline-flex"
            >
              Invite & earn
            </Link>
            <AccountMenu className="ml-1" />
          </>
        )}
      </div>
    </div>
  );
}

function HoverNav({
  href,
  active,
  label,
  icon,
  items,
  columns = 2,
  comingSoon,
}: {
  href: string;
  active?: boolean;
  label: string;
  icon: ReactNode;
  items: NavCard[];
  columns?: 2 | 3 | 4;
  comingSoon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  const show = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    updatePos();
    setOpen(true);
  };
  const hide = () => {
    leaveTimer.current = setTimeout(() => setOpen(false), 140);
  };

  const menu =
    open &&
    mounted &&
    pos &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        style={{ top: pos.top, left: pos.left }}
        className={cn(
          "fixed z-[200] p-2",
          "rounded-2xl bg-[#1c1c1c]/95 backdrop-blur-xl",
          "shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.08]",
          "animate-in fade-in-0 zoom-in-95 origin-top-left duration-150",
          columns === 2 && items.length <= 2 && "w-[248px]",
          columns === 2 && items.length > 2 && "w-[320px]",
        )}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        <div
          className={cn(
            "grid gap-1.5",
            columns === 2 && "grid-cols-2",
            columns === 3 && "grid-cols-3",
            columns === 4 && "grid-cols-4",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-2.5 rounded-xl px-3 py-4",
                "bg-white/[0.04] text-[#f5f5f5] transition-colors",
                "hover:bg-white/[0.08]",
              )}
            >
              <span className="text-[#f5f5f5]">{item.icon}</span>
              <span className="text-center text-[12px] font-medium leading-tight tracking-tight">
                {item.label}
              </span>
              {comingSoon && (
                <span className="absolute top-1.5 right-1.5 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-[#8a8a8a]">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        ref={triggerRef}
        href={href}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
          active || open
            ? "lib-chip-active text-[#f5f5f5]"
            : "text-[#8a8a8a] hover:bg-white/[0.04] hover:text-[#d4d4d4]",
        )}
      >
        {icon}
        {label}
      </Link>
      {menu}
    </div>
  );
}

function IconBtn({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-[#8a8a8a] transition-colors duration-200 hover:bg-white/[0.04] hover:text-[#d4d4d4]"
    >
      {children}
    </button>
  );
}
