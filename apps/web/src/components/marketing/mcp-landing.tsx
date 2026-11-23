"use client";

import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarketingNav } from "@/components/marketing/site-nav";
import {
  AiClientLogo,
  MCP_CLIENTS,
  type McpClientId,
} from "@/components/marketing/ai-client-logo";
import { setupForClient } from "@/lib/marketing/mcp-client-configs";
import { useSession } from "@/lib/library/session";
import { cn } from "@/lib/utils";

const TOOLS = [
  { name: "search_screens", desc: "Screens by product, market, journey, or pattern." },
  { name: "search_flows", desc: "Ordered journeys: deposit, betslip, onboarding." },
  { name: "search_ui", desc: "Elements: odds button, side nav, loader, skeleton." },
  { name: "get_motion", desc: "Loaders and skeletons with clip URLs." },
  { name: "get_evidence", desc: "Regions, tags, media, replicate prompt." },
  { name: "get_flow", desc: "Full flow with steps and agent prompt." },
  { name: "get_operator", desc: "Operator profile across screens and flows." },
  { name: "list_patterns", desc: "Aggregated UX patterns across operators." },
  { name: "most_used_pattern", desc: "Top pattern for a journey or UI kind." },
  { name: "compare_operators", desc: "Side-by-side on a journey or surface." },
];

/** Left column scrolls to config; right column stays sticky. */
export function McpLanding() {
  const [copied, setCopied] = useState<"url" | "config" | null>(null);
  const [endpoint, setEndpoint] = useState(
    "https://blaast-five.vercel.app/api/mcp",
  );
  const [health, setHealth] = useState<"checking" | "ok" | "err">("checking");
  const [toolCount, setToolCount] = useState(0);
  const [clientId, setClientId] = useState<McpClientId>("cursor");
  const configRef = useRef<HTMLElement>(null);
  const { loggedIn, user } = useSession();

  useEffect(() => {
    const url = `${window.location.origin}/api/mcp`;
    setEndpoint(url);
    void fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error("bad");
        const data = (await r.json()) as { tools?: string[] };
        setToolCount(data.tools?.length ?? 0);
        setHealth("ok");
      })
      .catch(() => setHealth("err"));
  }, []);

  const setup = useMemo(() => setupForClient(clientId), [clientId]);
  const config = useMemo(() => setup.snippet(endpoint), [setup, endpoint]);

  const selectClient = useCallback((id: McpClientId) => {
    setClientId(id);
    // Scroll the left config into view; sticky right column stays put
    requestAnimationFrame(() => {
      configRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  async function copy(kind: "url" | "config") {
    await navigator.clipboard.writeText(kind === "url" ? endpoint : config);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  }

  const planLabel = user?.plan ?? "guest";
  const canUseMcp =
    !loggedIn ||
    user?.plan === "pro" ||
    user?.plan === "team" ||
    user?.plan === "enterprise" ||
    user?.role === "owner" ||
    user?.role === "admin" ||
    user?.role === "curator";

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <MarketingNav solid />

      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 pt-16 pb-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 lg:pt-24 lg:pb-28">
        {/* Left: intro → scrolls to config on client click */}
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-wide text-emerald-700 uppercase">
            {health === "ok"
              ? `Live · ${toolCount} tools`
              : health === "checking"
                ? "Checking endpoint"
                : "Endpoint unreachable"}
          </p>
          <h1 className="mt-3 max-w-[14ch] text-[2.5rem] leading-[1.06] font-semibold tracking-tight sm:text-[3.25rem]">
            One URL. Any MCP client.
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-neutral-500">
            Paste the Streamable HTTP endpoint into your agent. Pick a client on
            the right for the exact config. Tools include{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px]">
              search_screens
            </code>{" "}
            and{" "}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px]">
              get_flow
            </code>
            .
          </p>

          <ol className="mt-10 space-y-6">
            {[
              {
                n: "01",
                t: "Copy the server URL",
                d: "Same endpoint on localhost or production.",
              },
              {
                n: "02",
                t: "Pick your client",
                d: "Click Cursor, Claude, ChatGPT, VS Code, Windsurf, or Codex. You’ll jump to that config below.",
              },
              {
                n: "03",
                t: "Ask for operator UX",
                d: "Example: show Stake deposit loaders. You get screens, clips, and replicate prompts.",
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="mt-0.5 w-6 shrink-0 text-[12px] font-semibold text-neutral-300">
                  {s.n}
                </span>
                <div>
                  <p className="text-[15px] font-semibold">{s.t}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">
                    {s.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <p className="mb-2 text-[12px] font-medium text-neutral-500">
              Server URL
            </p>
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <code className="min-w-0 flex-1 truncate text-[14px] text-neutral-800">
                {endpoint}
              </code>
              <button
                type="button"
                onClick={() => copy("url")}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-neutral-950 px-4 text-[13px] font-medium text-white"
              >
                {copied === "url" ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied === "url" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
              {canUseMcp ? (
                loggedIn ? (
                  <>Ready to connect (plan: {planLabel}).</>
                ) : (
                  <>Ready to connect (agents do not need a Blaast cookie).</>
                )
              ) : (
                <>
                  You’re on Free.{" "}
                  <Link href="/settings/billing" className="underline">
                    Upgrade to Pro
                  </Link>{" "}
                  or connect from the agent without cookies.
                </>
              )}
            </p>
          </div>

          {/* Config anchor — scrolled into view from sticky right */}
          <section
            ref={configRef}
            id="mcp-config"
            className="mt-16 scroll-mt-28 border-t border-neutral-200 pt-12"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
                  Config
                </p>
                <h2 className="mt-1 text-[1.65rem] font-semibold tracking-tight">
                  {setup.name}
                </h2>
                <p className="mt-2 text-[14px] text-neutral-500">{setup.where}</p>
                {setup.fileHint ? (
                  <p className="mt-1.5 font-mono text-[12px] text-neutral-400">
                    {setup.fileHint}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => copy("config")}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-[13px] font-medium text-white"
              >
                {copied === "config" ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied === "config" ? "Copied" : `Copy ${setup.name}`}
              </button>
            </div>

            <ol className="mt-8 space-y-3">
              {setup.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[14px] text-neutral-600">
                  <span className="w-5 shrink-0 font-medium text-neutral-300">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <pre className="mt-8 overflow-x-auto bg-neutral-950 p-5 text-[12.5px] leading-[1.65] text-neutral-300 sm:p-6">
              {config}
            </pre>
          </section>

          <section className="mt-16 border-t border-neutral-200 pt-12">
            <h2 className="text-[1.25rem] font-semibold tracking-tight">
              Tools
            </h2>
            <ul className="mt-6 space-y-4">
              {TOOLS.map((t) => (
                <li key={t.name} className="border-b border-neutral-100 pb-4">
                  <code className="text-[13px] font-medium text-emerald-800">
                    {t.name}
                  </code>
                  <p className="mt-1 text-[13px] text-neutral-500">{t.desc}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/library"
              className="mt-6 inline-block text-[14px] font-medium text-neutral-950 underline underline-offset-4"
            >
              Open the library
            </Link>
          </section>
        </div>

        {/* Right: sticky client picker + ask */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-neutral-200 bg-neutral-50/80 p-5 sm:p-6">
            <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
              Works with
            </p>
            <ul className="mt-4 space-y-0.5">
              {MCP_CLIENTS.map((c) => {
                const active = clientId === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => selectClient(c.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                        active
                          ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200"
                          : "text-neutral-500 hover:bg-white/70 hover:text-neutral-800",
                      )}
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ background: c.bg }}
                        aria-hidden
                      >
                        <AiClientLogo id={c.id} className="size-4" />
                      </span>
                      <span className="text-[14px] font-medium">{c.name}</span>
                      {active ? (
                        <span className="ml-auto text-[11px] font-medium text-neutral-400">
                          Config ↓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>

      <footer className="border-t border-neutral-200 px-6 py-10 text-[12px] text-neutral-500">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <span className="text-[14px] font-semibold text-neutral-950">
            Blaast
          </span>
          <span>MCP · {endpoint.replace(/^https?:\/\//, "")}</span>
        </div>
      </footer>
    </div>
  );
}
