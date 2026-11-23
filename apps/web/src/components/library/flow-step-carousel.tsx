"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, X } from "lucide-react";
import { CaptureMedia } from "@/components/library/capture-media";
import {
  buildAgentPrompt,
  type CatalogFlow,
  type CatalogOperator,
} from "@/lib/library/catalog";
import { useMcpAccess } from "@/lib/platform/mcp-access";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  operator: CatalogOperator;
  flow: CatalogFlow | null;
  initialStepId?: string;
  onClose: () => void;
};

/**
 * Mobbin-style step carousel for a flow — stays on the operator page.
 * Screenshots step-by-step (not the full-page video theater).
 */
export function FlowStepCarousel({
  open,
  operator,
  flow,
  initialStepId,
  onClose,
}: Props) {
  const mcp = useMcpAccess();
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);

  useEffect(() => {
    if (!open || !flow) return;
    const idx = initialStepId
      ? Math.max(
          0,
          flow.steps.findIndex((s) => s.id === initialStepId),
        )
      : 0;
    setStep(idx === -1 ? 0 : idx);
    setPrompt(null);
    setCopied(false);
  }, [open, flow, initialStepId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!flow) return;
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight")
        setStep((s) => Math.min(flow.steps.length - 1, s + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flow, onClose]);

  const loadPrompt = useCallback(async () => {
    if (!flow) return "";
    setPromptLoading(true);
    try {
      const res = await fetch(
        `/api/prompts/generate?flowId=${encodeURIComponent(flow.id)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { prompt: string };
        setPrompt(data.prompt);
        return data.prompt;
      }
    } catch {
      /* fallback */
    }
    const fallback = buildAgentPrompt(operator, flow, window.location.origin);
    setPrompt(fallback);
    setPromptLoading(false);
    return fallback;
  }, [flow, operator]);

  useEffect(() => {
    if (open && flow) void loadPrompt().finally(() => setPromptLoading(false));
  }, [open, flow, loadPrompt]);

  const copyPrompt = useCallback(async () => {
    if (!mcp.requireMcp()) return;
    let text = prompt;
    if (!text) text = await loadPrompt();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [prompt, loadPrompt, mcp]);

  if (!open || !flow) return null;

  const total = flow.steps.length;
  const safeStep = Math.min(Math.max(0, step), Math.max(0, total - 1));
  const current = flow.steps[safeStep];
  if (!current) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/80"
          aria-label="Close"
          onClick={onClose}
        />
        <div className="relative z-10 rounded-2xl border border-white/10 bg-neutral-950 px-6 py-5 text-center shadow-2xl">
          <p className="text-[15px] font-medium text-white">
            No screens in this flow yet
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-neutral-950"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isMobile = operator.platform === "mobile";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/45">
              {flow.group} · {operator.name}
            </p>
            <p className="truncate text-[15px] font-semibold text-white">
              {flow.name}
              <span className="ml-2 font-normal text-white/40">
                Step {safeStep + 1} / {total}
              </span>
            </p>
          </div>
          <button
            type="button"
            disabled={promptLoading}
            onClick={() => void copyPrompt()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-neutral-950 hover:bg-white/90 disabled:opacity-50"
          >
            <Copy className="size-3.5" />
            {copied
              ? "Copied"
              : mcp.allowed
                ? "Copy prompt"
                : "Copy prompt 🔒"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
          >
            <X className="size-4 text-white" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
          {/* Main step */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Previous step"
              disabled={safeStep === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white disabled:opacity-25"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div
              className={cn(
                "mx-auto w-full overflow-hidden rounded-2xl ring-1 ring-white/10",
                isMobile ? "max-w-[280px]" : "max-w-3xl",
              )}
            >
              <div
                className={cn(
                  "overflow-hidden bg-[#141414]",
                  isMobile ? "aspect-[9/19]" : "aspect-[16/10]",
                )}
              >
                <CaptureMedia
                  key={current.id}
                  posterUrl={
                    current.posterUrl ?? flow.posterUrl ?? operator.posterUrl
                  }
                  videoUrl={
                    current.videoUrl ?? flow.videoUrl ?? operator.videoUrl
                  }
                  atMs={current.atMs}
                  region={current.region}
                  clipWindow={current.clipWindow}
                  label={`${safeStep + 1}. ${current.label}`}
                  playOnHover
                  hovering
                />
              </div>
            </div>

            <button
              type="button"
              aria-label="Next step"
              disabled={safeStep >= total - 1}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white disabled:opacity-25"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <p className="text-center text-[13px] text-white/55">
            {current.label}
            {flow.actions.length > 0 && (
              <span className="text-white/35">
                {" "}
                · {flow.actions.join(" → ")}
              </span>
            )}
          </p>

          {/* Step filmstrip carousel */}
          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-white/40 uppercase">
              Journey steps
            </p>
            <ul className="flex gap-3 overflow-x-auto pb-1">
              {flow.steps.map((s, i) => {
                const active = i === safeStep;
                return (
                  <li key={s.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className={cn(
                        "w-[140px] overflow-hidden rounded-xl text-left transition ring-offset-2 ring-offset-neutral-950",
                        active
                          ? "ring-2 ring-white"
                          : "ring-1 ring-white/10 hover:ring-white/30",
                      )}
                    >
                      <div className="aspect-[16/10] bg-[#1a1a1a]">
                        <CaptureMedia
                          posterUrl={
                            s.posterUrl ?? flow.posterUrl ?? operator.posterUrl
                          }
                          videoUrl={s.videoUrl}
                          clipWindow={s.clipWindow}
                          atMs={s.atMs}
                        />
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="truncate text-[11px] font-medium text-white/90">
                          {i + 1}. {s.label}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
