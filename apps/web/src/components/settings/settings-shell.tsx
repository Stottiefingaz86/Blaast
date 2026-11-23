"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Code2,
  Settings2,
  Users,
  User,
} from "lucide-react";
import { BlaastMark } from "@/components/brand/blaast-mark";
import { RequireAuth } from "@/components/library/require-auth";
import { AccountMenu } from "@/components/library/account-menu";
import { useSession } from "@/lib/library/session";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/settings/account", label: "Account", icon: User },
  { href: "/settings/preferences", label: "Preferences", icon: Settings2 },
  { href: "/settings/billing", label: "Billing & Usage", icon: CreditCard },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/mcp", label: "MCP", icon: Code2 },
] as const;

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <SettingsChrome>{children}</SettingsChrome>
    </RequireAuth>
  );
}

function SettingsChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useSession();

  return (
    <div className="lib-surface min-h-screen">
      <header className="lib-chrome lib-hairline sticky top-0 z-[100] flex h-14 items-center gap-3 border-b px-4 sm:px-5">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/library");
          }}
          className="flex size-9 items-center justify-center rounded-full text-[#8a8a8a] transition-colors hover:bg-white/[0.05] hover:text-[#f5f5f5]"
          aria-label="Go back"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
        </button>
        <Link
          href="/library"
          className="flex items-center gap-2 text-[13px] font-medium text-[#cfcfcf] transition-colors hover:text-white"
        >
          <BlaastMark className="h-6" />
          <span className="hidden sm:inline">Back to library</span>
        </Link>
        <div className="relative z-[110] ml-auto">
          <AccountMenu />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-10 sm:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="sticky top-20 z-30 hidden self-start bg-[var(--lib-bg,#111)] sm:block">
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors duration-200",
                    active
                      ? "lib-chip-active text-[#f5f5f5]"
                      : "text-[#8a8a8a] hover:bg-white/[0.05] hover:text-[#f5f5f5]",
                  )}
                >
                  <Icon className="size-4 opacity-70" strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/library"
            className="mt-6 inline-flex items-center gap-1.5 px-3 text-[12px] text-[#8a8a8a] transition-colors hover:text-[#f5f5f5]"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.75} />
            Library
          </Link>
          <button
            type="button"
            onClick={() => {
              void logout().then(() => {
                window.location.href = "/";
              });
            }}
            className="mt-2 rounded-full px-3 py-2 text-[12px] text-[#636363] transition-colors hover:bg-white/[0.05] hover:text-[#cfcfcf]"
          >
            Log out
          </button>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
