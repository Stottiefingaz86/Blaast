"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library } from "lucide-react";
import { BlaastMark } from "@/components/brand/blaast-mark";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/library/session";

/** Mobbin-clean marketing nav — mark · text links · auth. */
export function MarketingNav({ solid }: { solid?: boolean }) {
  const pathname = usePathname();
  const { loggedIn } = useSession();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        solid ? "bg-white/90 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center px-6">
        <Link href="/" aria-label="Blaast home" className="flex shrink-0 items-center">
          <BlaastMark
            className="h-8"
            tone={solid ? "onLight" : "onDark"}
          />
        </Link>

        <nav className="ml-8 hidden items-center gap-6 sm:flex">
          {/* Studio is P2 — keep off public marketing chrome until shipped */}
          {[
            { href: "/mcp", label: "MCP" },
            { href: "/customers", label: "Customers" },
            { href: "/pricing", label: "Pricing" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-[14px] font-medium transition-colors",
                pathname === l.href || pathname.startsWith(`${l.href}/`)
                  ? "text-neutral-950"
                  : "text-neutral-500 hover:text-neutral-950",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {loggedIn ? (
            <Link
              href="/library"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-[13px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Library className="size-3.5" strokeWidth={1.75} />
              Library
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-full bg-neutral-950 px-4 py-2 text-[13px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Join for free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
