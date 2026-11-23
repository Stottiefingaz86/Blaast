"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Link2,
  MessageCircle,
  Pause,
  Play,
  X,
} from "lucide-react";
import { CaptureMedia } from "@/components/library/capture-media";
import {
  buildAgentPrompt,
  type CatalogFlow,
  type CatalogOperator,
} from "@/lib/library/catalog";
import { cn } from "@/lib/utils";

type Mode = "screens" | "video";
type PromptSource = "llm" | "evidence_template" | "offline_fallback" | null;

export function FlowTheater({
  operator,
  flow,
}: {
  operator: CatalogOperator;
  flow: CatalogFlow;
}) {
  const [mode, setMode] = useState<Mode>(flow.hasVideo ? "video" : "screens");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState<"link" | "prompt" | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptSource, setPromptSource] = useState<PromptSource>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const isMobile = operator.platform === "mobile";
  const current = flow.steps[step]!;
  const progress = ((step + 1) / flow.steps.length) * 100;

  useEffect(() => {
    if (!playing || mode !== "video") return;
    if (step >= flow.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), 1100);
    return () => window.clearTimeout(id);
  }, [playing, mode, step, flow.steps.length]);

  const loadPrompt = useCallback(async () => {
    setPromptLoading(true);
    setPromptError(null);
    try {
      const res = await fetch(
        `/api/prompts/generate?flowId=${encodeURIComponent(flow.id)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        prompt: string;
        source: "llm" | "evidence_template";
      };
      setPrompt(data.prompt);
      setPromptSource(data.source);
      return data.prompt;
    } catch (err) {
      const fallback = buildAgentPrompt(
        operator,
        flow,
        window.location.origin,
      );
      setPrompt(fallback);
      setPromptSource("offline_fallback");
      setPromptError(
        err instanceof Error ? err.message : "Generate failed — offline fallback",
      );
      return fallback;
    } finally {
      setPromptLoading(false);
    }
  }, [flow, operator]);

  useEffect(() => {
    void loadPrompt();
  }, [loadPrompt]);

  const copy = useCallback(
    async (kind: "link" | "prompt") => {
      if (kind === "link") {
        await navigator.clipboard.writeText(
          `${window.location.origin}/flows/${flow.id}`,
        );
        setCopied("link");
        window.setTimeout(() => setCopied(null), 2000);
        return;
      }
      let text = prompt;
      if (!text) {
        text = await loadPrompt();
      }
      await navigator.clipboard.writeText(text);
      setCopied("prompt");
      window.setTimeout(() => setCopied(null), 2500);
    },
    [flow.id, loadPrompt, prompt],
  );

  const sourceBadge =
    promptSource === "llm"
      ? "LLM"
      : promptSource === "evidence_template"
        ? "Evidence template"
        : promptSource === "offline_fallback"
          ? "Offline fallback"
          : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.08] px-4">
        <p className="min-w-0 flex-1 truncate text-[13px] text-neutral-300">
          <span className="text-neutral-500">{flow.group} in </span>
          <Link
            href={`/operators/${operator.slug}`}
            className="inline-flex items-center gap-1.5 font-medium text-white hover:underline"
          >
            {operator.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={operator.logoUrl}
                alt=""
                className="size-5 rounded bg-white object-contain p-0.5"
              />
            ) : (
              <span className="flex size-5 items-center justify-center rounded bg-white/15 text-[10px] font-bold">
                {operator.name.slice(0, 1)}
              </span>
            )}
            {operator.name}
          </Link>
        </p>

        <div className="flex h-8 items-center rounded-full bg-white/[0.1] p-0.5">
          {(["screens", "video"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={m === "video" && !flow.hasVideo}
              onClick={() => {
                setMode(m);
                setPlaying(m === "video");
              }}
              className={cn(
                "h-7 rounded-full px-3 text-[12px] font-medium capitalize disabled:opacity-40",
                mode === m
                  ? "bg-[#2a2a2a] text-white"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          <button
            type="button"
            aria-label="Feedback"
            className="flex size-9 items-center justify-center rounded-full text-neutral-400 hover:bg-white/[0.06] hover:text-white"
          >
            <MessageCircle className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Copy link"
            onClick={() => copy("link")}
            className="flex size-9 items-center justify-center rounded-full text-neutral-400 hover:bg-white/[0.06] hover:text-white"
          >
            <Link2 className="size-4" strokeWidth={1.75} />
          </button>
          <Link
            href={`/operators/${operator.slug}?tab=flows`}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full text-neutral-400 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-5" strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6">
        <p className="mb-4 text-center text-[15px] font-medium text-white">
          {flow.name}
          <span className="ml-2 text-neutral-500">
            {step + 1} / {flow.steps.length}
          </span>
        </p>

        <div className="relative flex w-full max-w-5xl items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous"
            disabled={step === 0}
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.max(0, s - 1));
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div
            className={cn(
              "relative w-full overflow-hidden rounded-2xl bg-[#141414] shadow-2xl ring-1 ring-white/10",
              isMobile ? "max-w-[320px]" : "max-w-4xl",
            )}
          >
            {mode === "video" && (
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="absolute top-1/2 left-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
              >
                {playing ? (
                  <Pause className="size-6" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="size-6" fill="currentColor" strokeWidth={0} />
                )}
              </button>
            )}
            <div
              className={cn(
                "mx-auto overflow-hidden",
                isMobile ? "aspect-[9/19]" : "aspect-[16/10]",
              )}
            >
              <CaptureMedia
                key={current.id}
                posterUrl={current.posterUrl ?? flow.posterUrl ?? operator.posterUrl}
                videoUrl={current.videoUrl ?? flow.videoUrl ?? operator.videoUrl}
                atMs={current.atMs}
                region={current.region}
                clipWindow={current.clipWindow}
                label={current.label}
                playOnHover
                hovering={playing || mode === "screens"}
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-2 truncate">
                {operator.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={operator.logoUrl}
                    alt=""
                    className="size-5 rounded bg-white object-contain p-0.5"
                  />
                ) : null}
                <span className="truncate text-neutral-300">
                  {operator.name} · {current.label}
                </span>
              </span>
              <span className="shrink-0">
                {current.evidenceId ? "evidence" : "curated"}
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Next"
            disabled={step >= flow.steps.length - 1}
            onClick={() => {
              setPlaying(false);
              setStep((s) => Math.min(flow.steps.length - 1, s + 1));
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mt-6 w-full max-w-xl">
          <div className="h-1 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between gap-1 overflow-x-auto">
            {flow.steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStep(i);
                }}
                className={cn(
                  "truncate text-[10px]",
                  i === step
                    ? "text-white"
                    : "text-neutral-600 hover:text-neutral-400",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 flex-col items-center gap-3 border-t border-white/[0.08] px-4 py-4 sm:flex-row sm:justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="h-10 rounded-full border border-white/[0.15] px-5 text-[13px] font-medium text-neutral-200 hover:bg-white/[0.06]"
          >
            Save
          </button>
          <button
            type="button"
            disabled={promptLoading}
            onClick={() => copy("prompt")}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.1] px-5 text-[13px] font-medium text-white hover:bg-white/[0.14] disabled:opacity-50"
          >
            <Copy className="size-3.5" strokeWidth={1.75} />
            {promptLoading
              ? "Generating…"
              : copied === "prompt"
                ? sourceBadge
                  ? `Copied (${sourceBadge})`
                  : "Copied prompt"
                : "Copy agent prompt"}
          </button>
          <button
            type="button"
            onClick={() => copy("link")}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/[0.15] px-4 text-[13px] font-medium text-neutral-200 hover:bg-white/[0.06]"
          >
            <Link2 className="size-3.5" />
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
        </div>
        <p className="text-[11px] text-neutral-500 sm:absolute sm:right-5">
          {operator.platform === "web" ? "Web (1440×900)" : "Mobile (390×844)"} ·{" "}
          <span className="text-neutral-400">{current.label}</span>
          {sourceBadge && (
            <>
              {" · "}
              <span className="text-neutral-400">{sourceBadge}</span>
            </>
          )}
        </p>
      </footer>

      <details className="border-t border-white/[0.06] bg-[#0d0d0d] px-4 py-2">
        <summary className="cursor-pointer text-[12px] text-neutral-500 hover:text-neutral-300">
          Agent prompt preview
          {sourceBadge ? ` — ${sourceBadge}` : ""}
          {promptLoading ? " (generating…)" : ""}
        </summary>
        {promptError && (
          <p className="mt-2 text-[11px] text-amber-500/90">{promptError}</p>
        )}
        <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-neutral-400">
          {promptLoading && !prompt
            ? "Generating from flow evidence…"
            : (prompt ?? "—")}
        </pre>
      </details>
    </div>
  );
}
