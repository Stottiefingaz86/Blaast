"use client";

import Link from "next/link";
import { Check, Copy, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { MarketingNav } from "@/components/marketing/site-nav";
import { AiChatInput } from "@/components/marketing/ai-chat-input";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/library/session";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    name: "search_screens",
    desc: "Find operator screens by product, market, journey, or UI pattern.",
  },
  {
    name: "search_flows",
    desc: "Query ordered journeys — deposit, betslip, onboarding, cash out.",
  },
  {
    name: "search_ui",
    desc: "Search UI elements (odds button, side nav, loader, skeleton…).",
  },
  {
    name: "get_motion",
    desc: "Find loaders / skeletons with measured motion + clip URLs.",
  },
  {
    name: "get_evidence",
    desc: "Full evidence pack: regions, tags, media, replicate prompt.",
  },
  {
    name: "get_flow",
    desc: "Load a full flow with ordered steps and an agent prompt.",
  },
  {
    name: "get_operator",
    desc: "Operator profile: screens, UI elements, and flow groups.",
  },
  {
    name: "list_patterns",
    desc: "Browse aggregated UX patterns across operators.",
  },
  {
    name: "most_used_pattern",
    desc: "Most-used pattern for a journey or UI kind.",
  },
  {
    name: "compare_operators",
    desc: "Compare two operators on a journey or surface.",
  },
];

const CLIENTS = [
  "Cursor",
  "Claude",
  "ChatGPT",
  "VS Code",
  "Windsurf",
  "Codex",
];

/**
 * Full-bleed MCP page — real endpoint, Cursor config, connect status.
 */
export function McpLanding() {
  const [copied, setCopied] = useState<"url" | "config" | null>(null);
  const [endpoint, setEndpoint] = useState("https://blaast-five.vercel.app/api/mcp");
  const [health, setHealth] = useState<"checking" | "ok" | "err">("checking");
  const [toolCount, setToolCount] = useState(0);
  const router = useRouter();
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

  const config = `{
  "mcpServers": {
    "blaast": {
      "url": "${endpoint}"
    }
  }
}`;

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
    user?.role === "admin";

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <MarketingNav solid />

      <section className="mx-auto grid max-w-[1100px] gap-12 px-6 pt-16 pb-20 lg:grid-cols-2 lg:gap-16 lg:pt-24">
        <div className="animate-fade-up">
          <p className="mb-3 text-[12px] font-semibold tracking-wide text-emerald-700 uppercase">
            {health === "ok"
              ? `Live · ${toolCount} tools`
              : health === "checking"
                ? "Checking endpoint…"
                : "Endpoint unreachable"}
          </p>
          <h1 className="text-[2.5rem] leading-[1.08] font-semibold tracking-tight sm:text-[3.25rem]">
            One URL.
            <br />
            Any MCP client.
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-neutral-500">
            Paste the Streamable HTTP endpoint into Cursor (or Claude / ChatGPT).
            Agents call{" "}
            <code className="rounded bg-neutral-100 px-1 text-[13px]">
              search_screens
            </code>
            ,{" "}
            <code className="rounded bg-neutral-100 px-1 text-[13px]">
              get_flow
            </code>
            , and more against your approved library.
          </p>

          <ol className="mt-10 space-y-6">
            {[
              {
                n: "01",
                t: "Copy the server URL",
                d: "Works against this deployment — localhost or blaast-five.vercel.app.",
              },
              {
                n: "02",
                t: "Add it in Cursor Settings → MCP",
                d: "New server → paste the JSON config below (or the URL alone).",
              },
              {
                n: "03",
                t: "Ask for operator UX",
                d: "“Show Stake deposit loaders” — get screens, clips, and replicate prompts.",
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="mt-0.5 text-[12px] font-semibold tracking-wide text-neutral-400">
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

          <div className="mt-8">
            <p className="mb-2 text-[12px] font-medium text-neutral-500">
              Server URL
            </p>
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 pl-4">
              <code className="min-w-0 flex-1 truncate text-[13px] text-neutral-800">
                {endpoint}
              </code>
              <button
                type="button"
                onClick={() => copy("url")}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-neutral-950 px-4 text-[13px] font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
                <>
                  Ready to connect
                  {loggedIn ? ` (plan: ${planLabel})` : " (no login required for agents)"}.
                  Free browser sessions that are logged-in get an upgrade message —
                  use Pro or connect from Cursor without a Blaast cookie.
                </>
              ) : (
                <>
                  You’re on Free —{" "}
                  <Link href="/settings/billing" className="underline">
                    upgrade to Pro
                  </Link>{" "}
                  for MCP from a logged-in browser, or connect Cursor without cookies.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="animate-scale-in flex flex-col gap-4">
          <div className="rounded-[28px] bg-neutral-100 p-6 sm:p-8">
            <p className="mb-4 text-[12px] font-medium tracking-wide text-neutral-500 uppercase">
              Works with
            </p>
            <div className="grid grid-cols-3 gap-3">
              {CLIENTS.map((c) => (
                <div
                  key={c}
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-white text-[13px] font-medium text-neutral-700 shadow-sm"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-neutral-950 p-5 text-white">
            <div className="mb-4 flex justify-end">
              <div className="max-w-[90%] rounded-2xl rounded-br-md bg-white/[0.08] px-4 py-3 text-[13px] leading-relaxed text-neutral-200">
                Show me how top operators design deposits that feel worth it
              </div>
            </div>
            <p className="mb-3 text-[12px] text-neutral-500">
              Try in library after connect
            </p>
            <AiChatInput
              className="border-white/10 bg-white/[0.06] shadow-none [&_textarea]:text-white [&_textarea]:placeholder:text-neutral-500"
              placeholder="Ask Blaast MCP…"
              onSend={(q) =>
                router.push(
                  loggedIn
                    ? `/library?brief=${encodeURIComponent(q)}`
                    : `/login?brief=${encodeURIComponent(q)}`,
                )
              }
            />
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-[1100px] px-6 py-16">
          <h2 className="text-[22px] font-semibold tracking-tight">Tools</h2>
          <ul className="mt-6 divide-y divide-neutral-200 overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
            {TOOLS.map((t) => (
              <li key={t.name} className="flex gap-4 px-5 py-4">
                <Terminal className="mt-0.5 size-4 shrink-0 text-neutral-400" />
                <div>
                  <code className="text-[13px] font-medium text-emerald-700">
                    {t.name}
                  </code>
                  <p className="mt-1 text-[13px] text-neutral-500">{t.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => copy("config")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-[14px] font-medium text-white"
            >
              {copied === "config" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied === "config" ? "Copied Cursor config" : "Copy Cursor config"}
            </button>
            <Link
              href="/library"
              className="text-[14px] font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-950 hover:decoration-neutral-900"
            >
              Open the library →
            </Link>
          </div>

          <pre
            className={cn(
              "mt-6 overflow-x-auto rounded-[20px] bg-neutral-950 p-5 text-[12px] leading-relaxed text-neutral-300",
            )}
          >
            {config}
          </pre>
        </div>
      </section>

      <footer className="bg-neutral-950 px-6 py-10 text-[12px] text-neutral-500">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <span className="text-[14px] font-semibold text-white">Blaast</span>
          <span>MCP · Streamable HTTP · {endpoint.replace(/^https?:\/\//, "")}</span>
        </div>
      </footer>
    </div>
  );
}
