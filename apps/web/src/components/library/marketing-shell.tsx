"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlaastMark } from "@/components/brand/blaast-mark";
import { cn } from "@/lib/utils";

/** Thin marketing strip above the logged-in library shell. */
export function MarketingBar() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
      <div className="mx-auto flex h-11 max-w-[1400px] items-center gap-6 px-5">
        <Link href="/library" className="flex items-center gap-2">
          <BlaastMark className="h-6" />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <MarketingLink href="/mcp" active={pathname === "/mcp"}>
            MCP
          </MarketingLink>
          <MarketingLink href="/pricing" active={pathname === "/pricing"}>
            Pricing
          </MarketingLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/settings/billing"
            className="rounded-full border border-white/[0.15] px-3 py-1 text-[12px] font-medium text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Invite & earn
          </Link>
          <Link
            href="/settings/account"
            className="flex size-8 items-center justify-center rounded-full bg-emerald-600 text-[12px] font-semibold text-white transition-transform duration-200 hover:scale-105"
            title="Settings"
          >
            Y
          </Link>
        </div>
      </div>
    </div>
  );
}

function MarketingLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-[13px] transition-all duration-200",
        active
          ? "bg-white/[0.1] font-medium text-white"
          : "text-neutral-400 hover:bg-white/[0.08] hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
