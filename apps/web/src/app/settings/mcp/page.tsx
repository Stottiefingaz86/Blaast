"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  MCP_CATALOG,
  useAccount,
  type McpToolId,
} from "@/lib/platform/account-store";
import {
  MCP_UPGRADE_MESSAGE,
  useMcpAccess,
} from "@/lib/platform/mcp-access";
import { cn } from "@/lib/utils";

export default function McpSettingsPage() {
  const account = useAccount();
  const mcp = useMcpAccess();
  const allowed = mcp.allowed;
  const connectedIds = new Set(account.connections.map((c) => c.toolId));
  const [banner, setBanner] = useState<string | null>(null);

  function connect(id: McpToolId, name: string) {
    if (!allowed) {
      setBanner(MCP_UPGRADE_MESSAGE);
      window.setTimeout(() => {
        window.location.href = "/pricing?upgrade=mcp";
      }, 1200);
      return;
    }
    account.connectMcp(id, name);
    setBanner(null);
    void fetch("/api/analytics/track", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "mcp_activate", tool: id }),
    });
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">MCP</h1>
      <p className="mt-2 text-[14px] text-neutral-400">
        Connect your AI agents directly to Blaast.{" "}
        <Link
          href="/mcp"
          className="underline decoration-white/25 hover:decoration-white"
        >
          See documentation
        </Link>
      </p>

      {!allowed && (
        <div className="mt-6 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-[13px] text-neutral-200">
          {MCP_UPGRADE_MESSAGE}{" "}
          <Link
            href="/pricing?upgrade=mcp"
            className="font-medium text-white underline"
          >
            View pricing
          </Link>
        </div>
      )}

      {banner && (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-50">
          {banner}
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-[13px] font-medium text-neutral-400">Connected</h2>
        {account.connections.length === 0 ? (
          <p className="mt-3 text-[13px] text-neutral-500">
            No agents connected yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08]">
            {account.connections.map((c) => {
              const meta = MCP_CATALOG.find((t) => t.id === c.toolId);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.08] text-[13px]">
                    {meta?.icon ?? "·"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{c.label}</p>
                    <p className="text-[11px] text-neutral-500">
                      Connected {c.connectedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Disconnect"
                    onClick={() => account.disconnectMcp(c.id)}
                    className="flex size-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[13px] font-medium text-neutral-400">
          Connect more tools
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MCP_CATALOG.map((tool) => {
            const already = connectedIds.has(tool.id);
            return (
              <button
                key={tool.id}
                type="button"
                disabled={already}
                onClick={() => connect(tool.id, tool.name)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-all duration-200",
                  !already
                    ? "hover:-translate-y-0.5 hover:bg-white/[0.06]"
                    : "opacity-50",
                  !allowed && !already && "opacity-80",
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/[0.08] text-[13px]">
                  {tool.icon}
                </span>
                <span className="text-[13px] font-medium">
                  {tool.name}
                  {!allowed ? " 🔒" : ""}
                </span>
              </button>
            );
          })}
          <Link
            href="/mcp"
            className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-white/[0.12] p-4 text-[13px] text-neutral-400 transition-colors hover:border-white/25 hover:text-white"
          >
            <span className="text-lg">→</span>
            See all
          </Link>
        </div>
      </section>
    </div>
  );
}
