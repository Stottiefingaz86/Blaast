"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  MoreHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { CaptureMedia } from "@/components/library/capture-media";
import { ElementPromptModal } from "@/components/library/element-prompt-modal";
import { FlowStepCarousel } from "@/components/library/flow-step-carousel";
import {
  LobbyTrimModal,
  type LobbyTrimTarget,
} from "@/components/library/lobby-trim-modal";
import { SiteHeader } from "@/components/library/site-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  CatalogFlow,
  CatalogOperator,
  CatalogUiElement,
  MediaRegion,
} from "@/lib/library/catalog";
import {
  uiCategoryLabel,
  type LibraryCategory,
} from "@/lib/library/journeys";
import { useMcpAccess } from "@/lib/platform/mcp-access";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

const RATING_KEY = (slug: string) => `blaast:operator-rating:${slug}`;
const SAVED_KEY = (slug: string) => `blaast:operator-saved:${slug}`;

function buildOperatorMcpPrompt(operator: CatalogOperator, origin: string) {
  const host = operator.hostname ?? `${operator.slug.replace(/-/g, ".")}`;
  return `Use Blaast MCP for ${operator.name} (${host}).

1. Call \`get_operator\` with slug \`${operator.slug}\`
2. Call \`search_screens\` / \`search_ui\` / \`search_flows\` scoped to this operator
3. For patterns: \`most_used_pattern\` or \`notable_flows\` with vertical/segment filters
4. Load details via \`get_evidence\` / \`get_flow\` / \`get_pattern\` — cite evidence IDs
5. Library: ${origin}/operators/${operator.slug}

Do not invent screens — only use returned evidence.`;
}

const UI_CATEGORY_ORDER: LibraryCategory[] = [
  "Cross",
  "Casino",
  "Sports",
  "Cashier",
  "Rewards",
  "Account",
];

function HoverCapture(props: {
  posterUrl?: string;
  videoUrl?: string;
  atMs?: number;
  region?: MediaRegion;
  clipWindow?: { startMs: number; endMs: number };
  label?: string;
  /** Force continuous loop (loaders). Trimmed clips also loop by default. */
  loopTrim?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const hasTrim = props.clipWindow != null || props.atMs != null;
  // Trimmed tiles always loop the In→Out window; untrimmed play on hover
  const loop = Boolean(props.loopTrim || hasTrim);
  return (
    <div
      className="size-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <CaptureMedia
        posterUrl={props.posterUrl}
        videoUrl={props.videoUrl}
        atMs={props.atMs}
        region={props.region}
        clipWindow={props.clipWindow}
        label={props.label}
        playOnHover={!loop}
        hovering={loop ? true : hover}
        loop={loop}
      />
    </div>
  );
}

type Tab = "screens" | "ui" | "flows";

const TABS = [
  ["screens", "Screens"],
  ["ui", "UI Elements"],
  ["flows", "Flows"],
] as const;

export function OperatorDetail({ operator }: { operator: CatalogOperator }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const flowParam = searchParams.get("flow");
  const [tab, setTab] = useState<Tab>(
    tabParam === "flows" || tabParam === "ui" || tabParam === "screens"
      ? tabParam
      : "screens",
  );
  const [openGroup, setOpenGroup] = useState<string | null>(
    operator.flows[0]?.group ?? null,
  );
  const [tabsPinned, setTabsPinned] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [rateHover, setRateHover] = useState(0);
  const [mcpPromptOpen, setMcpPromptOpen] = useState(false);
  const [mcpPrompt, setMcpPrompt] = useState("");
  const [mcpCopied, setMcpCopied] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [trimTarget, setTrimTarget] = useState<LobbyTrimTarget | null>(null);
  const [promptElement, setPromptElement] = useState<CatalogUiElement | null>(
    null,
  );
  const [uiCategory, setUiCategory] = useState<string>("All");
  const [flowCarousel, setFlowCarousel] = useState<CatalogFlow | null>(null);
  const [flowStepId, setFlowStepId] = useState<string | undefined>();
  const tabsSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem(RATING_KEY(operator.slug));
      setUserRating(r ? Number(r) : null);
      setSaved(localStorage.getItem(SAVED_KEY(operator.slug)) === "1");
    } catch {
      /* ignore */
    }
  }, [operator.slug]);

  const displayRating = useMemo(() => {
    if (userRating == null) {
      return { rating: operator.rating, count: operator.ratingCount };
    }
    const count = operator.ratingCount + 1;
    const rating =
      (operator.rating * operator.ratingCount + userRating) / count;
    return { rating, count };
  }, [operator.rating, operator.ratingCount, userRating]);

  const websiteUrl = useMemo(() => {
    const host = operator.hostname?.trim();
    if (!host) return null;
    return host.startsWith("http") ? host : `https://${host}`;
  }, [operator.hostname]);

  const toggleSaved = useCallback(() => {
    setSaved((v) => {
      const next = !v;
      try {
        localStorage.setItem(SAVED_KEY(operator.slug), next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [operator.slug]);

  const submitRating = useCallback(
    (stars: number) => {
      setUserRating(stars);
      try {
        localStorage.setItem(RATING_KEY(operator.slug), String(stars));
      } catch {
        /* ignore */
      }
      setRateOpen(false);
    },
    [operator.slug],
  );

  const mcp = useMcpAccess();

  const openMcpPrompt = useCallback(() => {
    if (!mcp.requireMcp()) return;
    const text = buildOperatorMcpPrompt(operator, window.location.origin);
    setMcpPrompt(text);
    setMcpCopied(false);
    setMcpPromptOpen(true);
    void fetch("/api/analytics/track", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "brand_copy",
        brand: operator.slug,
      }),
    });
  }, [operator, mcp]);

  const downloadScreens = useCallback(async () => {
    const targets = operator.screens.filter((s) => s.posterUrl);
    if (!targets.length) return;
    setDownloadBusy(true);
    try {
      for (let i = 0; i < targets.length; i++) {
        const s = targets[i]!;
        const res = await fetch(s.posterUrl!);
        if (!res.ok) continue;
        const blob = await res.blob();
        const ext = blob.type.includes("png")
          ? "png"
          : blob.type.includes("webp")
            ? "webp"
            : "jpg";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${operator.slug}-${String(i + 1).padStart(2, "0")}-${s.title.replace(/[^\w.-]+/g, "-").toLowerCase()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        await new Promise((r) => setTimeout(r, 200));
      }
    } finally {
      setDownloadBusy(false);
    }
  }, [operator.screens, operator.slug]);

  useEffect(() => {
    if (!flowParam) return;
    const flow =
      operator.flows.find((f) => f.id === flowParam) ??
      operator.flows.find((f) => f.id.endsWith(`-${flowParam}`)) ??
      null;
    if (!flow) return;
    setTab("flows");
    setOpenGroup(flow.group);
    setFlowCarousel(flow);
  }, [flowParam, operator.flows]);

  useEffect(() => {
    const el = tabsSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setTabsPinned(
          !entry.isIntersecting && entry.boundingClientRect.top < 56,
        );
      },
      { root: null, rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, typeof operator.flows>();
    for (const f of operator.flows) {
      const list = map.get(f.group) ?? [];
      list.push(f);
      map.set(f.group, list);
    }
    return [...map.entries()];
  }, [operator.flows]);

  const uiCategories = useMemo(() => {
    const set = new Set(
      operator.uiElements
        .map((e) => e.category)
        .filter(Boolean) as LibraryCategory[],
    );
    const ordered = UI_CATEGORY_ORDER.filter((c) => set.has(c));
    for (const c of set) {
      if (!ordered.includes(c)) ordered.push(c);
    }
    return ["All", ...ordered] as string[];
  }, [operator.uiElements]);

  const filteredUi = useMemo(() => {
    return operator.uiElements.filter((el) => {
      if (uiCategory === "All") return true;
      return (el.category || "Cross") === uiCategory;
    });
  }, [operator.uiElements, uiCategory]);

  const isMobile = operator.platform === "mobile";

  return (
    <div className="lib-surface min-h-screen">
      {/* One sticky slot: main rolls out, Screens/UI/Flows rolls in */}
      <div className="lib-chrome lib-hairline sticky top-0 z-[100] h-14 border-b">
        <div className="relative h-14 overflow-hidden">
          <div
            className={cn(
              "absolute inset-x-0 top-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              tabsPinned
                ? "-translate-y-full opacity-0"
                : "translate-y-0 opacity-100",
            )}
          >
            <SiteHeader
              tab="library"
              searchPlaceholder="Search on Web…"
            />
          </div>
          <div
            className={cn(
              "absolute inset-x-0 top-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              tabsPinned
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0",
            )}
            aria-hidden={!tabsPinned}
          >
            <DetailTabBar
              tab={tab}
              onTab={setTab}
              operator={operator}
              dense
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pt-6 pb-4">
        <Link
          href="/library"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.75} />
          Back to library
        </Link>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {operator.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={operator.logoUrl}
              alt=""
              className="size-16 shrink-0 rounded-2xl bg-white object-contain p-1.5"
            />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold text-white">
              {operator.name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {operator.name} — {operator.tagline}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-neutral-400">
              <button
                type="button"
                onClick={() => setRateOpen(true)}
                className="inline-flex items-center gap-1.5 text-white hover:opacity-90"
                title="Rate this operator"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-3.5",
                      i < Math.round(displayRating.rating)
                        ? "fill-white text-white"
                        : "text-neutral-600",
                    )}
                    strokeWidth={1.5}
                  />
                ))}
                <span className="ml-1">
                  {displayRating.rating.toFixed(2)} ({displayRating.count})
                  {userRating != null ? (
                    <span className="ml-1.5 text-neutral-500">
                      · you {userRating}★
                    </span>
                  ) : null}
                </span>
              </button>
              <span>
                <span className="text-neutral-500">Category</span>{" "}
                <span className="text-neutral-200">{operator.category}</span>
              </span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {/* Desktop = web capture · Mobile = phone / mobile-web capture */}
              <div
                className="flex h-9 items-center rounded-full bg-white/[0.08] p-0.5"
                role="group"
                aria-label="Capture platform"
              >
                {(
                  [
                    ["web", "Desktop"],
                    ["mobile", "Mobile"],
                  ] as const
                ).map(([id, label]) => {
                  const active = operator.platform === id;
                  return (
                    <span
                      key={id}
                      title={
                        active
                          ? `Showing ${label.toLowerCase()} captures`
                          : `No ${label.toLowerCase()} captures for this operator yet`
                      }
                      className={cn(
                        "h-8 rounded-full px-3.5 text-[12px] font-medium leading-8",
                        active
                          ? "bg-white/[0.14] text-white"
                          : "cursor-not-allowed text-neutral-600",
                      )}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
              <button
                type="button"
                aria-pressed={saved}
                onClick={toggleSaved}
                className={cn(
                  "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
                  saved
                    ? "border-white/25 bg-white/[0.08] text-white"
                    : "border-white/[0.15] text-neutral-200 hover:bg-white/[0.06]",
                )}
              >
                {saved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRateHover(userRating ?? 0);
                  setRateOpen(true);
                }}
                className={cn(
                  "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
                  userRating != null
                    ? "border-white/25 bg-white/[0.08] text-white"
                    : "border-white/[0.15] text-neutral-200 hover:bg-white/[0.06]",
                )}
              >
                {userRating != null ? `Rated ${userRating}★` : "Rate"}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="More"
                  className="flex size-9 items-center justify-center rounded-full border border-white/[0.15] text-neutral-300 outline-none hover:bg-white/[0.06] data-popup-open:bg-white/[0.08]"
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[220px] border-white/10 bg-neutral-950 text-neutral-100 shadow-xl"
                >
                  <DropdownMenuItem
                    disabled={!websiteUrl}
                    className="gap-2 focus:bg-white/10 focus:text-white"
                    onClick={() => {
                      if (websiteUrl) window.open(websiteUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="size-4 opacity-70" />
                    View website
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={
                      downloadBusy || !operator.screens.some((s) => s.posterUrl)
                    }
                    className="gap-2 focus:bg-white/10 focus:text-white"
                    onClick={() => void downloadScreens()}
                  >
                    <Download className="size-4 opacity-70" />
                    {downloadBusy ? "Downloading…" : "Download screens"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="gap-2 focus:bg-white/10 focus:text-white"
                    onClick={openMcpPrompt}
                  >
                    <Sparkles className="size-4 opacity-70" />
                    {mcp.allowed ? "Prompt for MCP" : "Prompt for MCP 🔒"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* In-flow tabs — scroll under sticky; then replace main header */}
      <div ref={tabsSentinelRef}>
        <div
          className={cn(
            "lib-hairline border-b",
            tabsPinned && "invisible pointer-events-none",
          )}
        >
          <DetailTabBar tab={tab} onTab={setTab} operator={operator} />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 py-6">
        {tab === "screens" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {operator.screens.map((screen) => {
              const flowHref =
                operator.flows.find((f) =>
                  f.steps.some((s) => s.id === screen.id),
                )?.id ?? operator.flows[0]?.id;
              const canTrim = Boolean(
                screen.sessionId && screen.artifactId && screen.videoUrl,
              );
              return (
                <div key={screen.id} className="group">
                  <Link
                    href={
                      flowHref
                        ? `/flows/${flowHref}?step=${encodeURIComponent(screen.id)}`
                        : `/operators/${operator.slug}`
                    }
                    className="block"
                  >
                    <div className="lib-card relative overflow-hidden rounded-[28px] p-5 sm:p-6">
                      {screen.videoUrl && (
                        <span className="absolute top-3 right-3 z-10 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-neutral-200">
                          Video
                        </span>
                      )}
                      <div
                        className={cn(
                          "mx-auto overflow-hidden ring-1 ring-white/10",
                          isMobile
                            ? "aspect-[9/19] max-w-[180px] rounded-[22px]"
                            : "aspect-[16/10] rounded-2xl",
                        )}
                      >
                        <HoverCapture
                          posterUrl={screen.posterUrl ?? operator.posterUrl}
                          videoUrl={screen.videoUrl}
                          clipWindow={screen.clipWindow}
                          label={screen.title}
                        />
                      </div>
                    </div>
                  </Link>
                  <div className="mt-2.5 flex items-center justify-between gap-2 px-0.5">
                    <p className="truncate text-[13px] font-medium text-neutral-200">
                      {screen.title}
                    </p>
                    {canTrim && (
                      <button
                        type="button"
                        className="shrink-0 rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/[0.14]"
                        onClick={() =>
                          setTrimTarget({
                            title: screen.title,
                            sessionId: screen.sessionId!,
                            artifactId: screen.artifactId!,
                            videoUrl: screen.videoUrl!,
                            durationMs: screen.durationMs ?? 30000,
                            clipWindow: screen.clipWindow,
                          })
                        }
                      >
                        Trim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "ui" &&
          (operator.uiElements.length === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <p className="text-[15px] font-medium text-white">
                No UI elements yet
              </p>
              <p className="mt-2 text-[13px] text-[#8a8a8a]">
                Capture Header / Side nav / Loader beats (or tag those patterns)
                and Approve — they show here as clean cards.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                  Category
                </span>
                {uiCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setUiCategory(c)}
                    className={cn(
                      "h-8 rounded-full px-3 text-[12px] font-medium",
                      uiCategory === c
                        ? "bg-white text-neutral-950"
                        : "bg-white/[0.08] text-neutral-300 hover:bg-white/[0.12]",
                    )}
                  >
                    {c === "All"
                      ? "All"
                      : `${uiCategoryLabel(c)} elements`}
                  </button>
                ))}
              </div>

              {filteredUi.length === 0 ? (
                <p className="py-12 text-center text-[13px] text-neutral-500">
                  No UI elements for this category.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredUi.map((el) => {
                    const isMotion = /loader|skeleton/i.test(el.name);
                    return (
                      <div key={el.id} className="group">
                        <button
                          type="button"
                          onClick={() => setPromptElement(el)}
                          className="lib-card relative w-full overflow-hidden rounded-[28px] p-5 text-left sm:p-6 ring-0 outline-none transition hover:ring-2 hover:ring-white/20 focus-visible:ring-2 focus-visible:ring-white/40"
                        >
                          <div
                            className={cn(
                              "pointer-events-none mx-auto overflow-hidden ring-1 ring-white/10",
                              isMobile
                                ? "aspect-[9/19] max-w-[180px] rounded-[22px]"
                                : "aspect-[16/10] rounded-2xl",
                            )}
                          >
                            <HoverCapture
                              posterUrl={el.posterUrl ?? operator.posterUrl}
                              videoUrl={el.videoUrl}
                              clipWindow={el.clipWindow}
                              atMs={el.atMs}
                              label={el.name}
                              loopTrim={isMotion}
                            />
                          </div>
                          <p className="mt-3 text-center text-[11px] text-white/35">
                            Click for Blaast MCP prompt
                          </p>
                        </button>
                        <div className="mt-2.5 px-0.5">
                          <button
                            type="button"
                            onClick={() => setPromptElement(el)}
                            className="truncate text-left text-[13px] font-medium text-neutral-200 hover:text-white"
                          >
                            {el.name}
                          </button>
                          {el.category && (
                            <p className="truncate text-[11px] text-neutral-500">
                              {uiCategoryLabel(el.category)} elements
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ))}

        {tab === "flows" && (
          <div className="relative flex flex-col gap-6 lg:flex-row">
            <aside className="relative z-20 w-full shrink-0 bg-[var(--lib-bg,#111)] lg:sticky lg:top-20 lg:w-56 lg:self-start lg:pr-2">
              <input
                type="search"
                placeholder="Search flows…"
                className="mb-4 h-9 w-full rounded-full bg-white/[0.08] px-3 text-[12px] text-white outline-none placeholder:text-neutral-500"
              />
              <div className="flex flex-col gap-1">
                {groups.map(([group, flows]) => {
                  const open = openGroup === group;
                  const groupLabel =
                    group === "Cross" ? "Home" : uiCategoryLabel(group);
                  return (
                    <div key={group}>
                      <button
                        type="button"
                        onClick={() => setOpenGroup(open ? null : group)}
                        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-neutral-200 hover:bg-white/[0.05]"
                      >
                        {open ? (
                          <ChevronDown className="size-3.5 text-neutral-500" />
                        ) : (
                          <ChevronRight className="size-3.5 text-neutral-500" />
                        )}
                        {groupLabel}
                      </button>
                      {open && (
                        <ul className="mb-2 ml-5 flex flex-col gap-0.5">
                          {flows.map((f) => (
                            <li key={f.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setFlowStepId(undefined);
                                  setFlowCarousel(f);
                                }}
                                className="block w-full rounded-md px-2 py-1.5 text-left text-[12px] text-neutral-400 hover:bg-white/[0.05] hover:text-white"
                              >
                                {f.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            <div className="relative z-0 isolate grid min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
              {operator.flows.map((flow) => {
                return (
                  <button
                    key={flow.id}
                    type="button"
                    onClick={() => {
                      setFlowStepId(undefined);
                      setFlowCarousel(flow);
                    }}
                    className="group text-left"
                  >
                    <div className="lib-card relative overflow-hidden rounded-[28px] p-5 sm:p-6">
                      <span className="absolute top-3 left-3 z-10 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-neutral-200">
                        {flow.steps.length} steps
                      </span>
                      <span className="absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-950 opacity-0 transition-opacity group-hover:opacity-100">
                        <ChevronRight className="size-4" />
                      </span>
                      <div
                        className={cn(
                          "pointer-events-none mx-auto overflow-hidden ring-1 ring-white/10",
                          isMobile
                            ? "aspect-[9/19] max-w-[200px] rounded-[22px]"
                            : "aspect-[16/10] rounded-2xl",
                        )}
                      >
                        <HoverCapture
                          posterUrl={flow.posterUrl ?? operator.posterUrl}
                          videoUrl={flow.videoUrl ?? operator.videoUrl}
                          clipWindow={flow.steps[0]?.clipWindow}
                          label={flow.name}
                        />
                      </div>
                    </div>
                    <div className="mt-2.5 px-0.5">
                      <p className="text-[13px] font-medium text-white">
                        {flow.name}
                      </p>
                      <p className="text-[12px] text-neutral-500">
                        {flow.steps.length} screens ·{" "}
                        {flow.group === "Cross"
                          ? "Home"
                          : uiCategoryLabel(flow.group)}
                        {flow.actions.length
                          ? ` · ${flow.actions.join(" → ")}`
                          : ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <LobbyTrimModal
        open={Boolean(trimTarget)}
        target={trimTarget}
        onClose={() => setTrimTarget(null)}
        onSaved={() => router.refresh()}
      />
      <ElementPromptModal
        open={Boolean(promptElement)}
        operator={operator}
        element={promptElement}
        onClose={() => setPromptElement(null)}
      />
      <FlowStepCarousel
        open={Boolean(flowCarousel)}
        operator={operator}
        flow={flowCarousel}
        initialStepId={flowStepId}
        onClose={() => {
          setFlowCarousel(null);
          setFlowStepId(undefined);
          if (flowParam) {
            router.replace(`/operators/${operator.slug}?tab=flows`, {
              scroll: false,
            });
          }
        }}
      />

      {rateOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setRateOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-white/45">Rate</p>
                <h2 className="text-[17px] font-semibold text-white">
                  {operator.name}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setRateOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="mb-4 text-[13px] text-neutral-400">
              How useful are these captures for research and rebuild?
            </p>
            <div
              className="flex items-center justify-center gap-2"
              onMouseLeave={() => setRateHover(userRating ?? 0)}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const n = i + 1;
                const lit = n <= (rateHover || userRating || 0);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    onMouseEnter={() => setRateHover(n)}
                    onClick={() => submitRating(n)}
                    className="rounded-lg p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-8",
                        lit
                          ? "fill-white text-white"
                          : "text-neutral-600",
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            {userRating != null && (
              <button
                type="button"
                className="mt-4 w-full text-center text-[12px] text-neutral-500 hover:text-neutral-300"
                onClick={() => {
                  setUserRating(null);
                  try {
                    localStorage.removeItem(RATING_KEY(operator.slug));
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Clear my rating
              </button>
            )}
          </div>
        </div>
      )}

      {mcpPromptOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setMcpPromptOpen(false)}
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white/45">Blaast MCP</p>
                <h2 className="truncate text-[15px] font-semibold text-white">
                  Prompt for {operator.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(mcpPrompt);
                  setMcpCopied(true);
                  window.setTimeout(() => setMcpCopied(false), 2000);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.1] px-3.5 text-[12px] font-medium text-white hover:bg-white/[0.14]"
              >
                <Copy className="size-3.5" />
                {mcpCopied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMcpPromptOpen(false)}
                className="flex size-9 items-center justify-center rounded-full text-neutral-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <pre className="overflow-auto p-4 text-[12px] leading-relaxed whitespace-pre-wrap text-neutral-300">
              {mcpPrompt}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailTabBar({
  tab,
  onTab,
  operator,
  dense,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  operator: CatalogOperator;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-[1400px] flex-wrap items-center gap-1 px-5",
        dense ? "h-14" : "",
      )}
    >
      {dense ? (
        <Link
          href="/library"
          className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Back to library"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
        </Link>
      ) : (
        <button
          type="button"
          className="mr-3 hidden text-[13px] text-neutral-500 sm:inline"
        >
          Latest <ChevronDown className="ml-0.5 inline size-3.5" />
        </button>
      )}
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          className={cn(
            "relative px-3 py-3.5 text-[14px] font-medium transition-colors",
            dense && "py-0",
            tab === id
              ? "text-white"
              : "text-neutral-500 hover:text-neutral-300",
          )}
        >
          {label}
          {tab === id && (
            <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-white" />
          )}
        </button>
      ))}
      <span className="ml-auto truncate text-[12px] text-neutral-500">
        {dense ? (
          <span className="hidden sm:inline">{operator.name}</span>
        ) : (
          <>
            {tab === "screens" && `Showing ${operator.screens.length} screens`}
            {tab === "ui" && `Showing ${operator.uiElements.length} elements`}
            {tab === "flows" && `Showing ${operator.flows.length} flows`}
          </>
        )}
      </span>
    </div>
  );
}
