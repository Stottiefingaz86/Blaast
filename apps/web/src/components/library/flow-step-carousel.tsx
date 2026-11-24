"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Link2,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import { CaptureMedia } from "@/components/library/capture-media";
import { LibraryOverlay } from "@/components/library/library-overlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildAgentPrompt,
  type CatalogFlow,
  type CatalogOperator,
} from "@/lib/library/catalog";
import {
  isFavorite,
  subscribeCollections,
  toggleFavorite,
} from "@/lib/library/collections-store";
import {
  copyImageAsPng,
  downloadImageUrl,
} from "@/lib/library/media-actions";
import { useMcpAccess } from "@/lib/platform/mcp-access";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  operator: CatalogOperator;
  flow: CatalogFlow | null;
  initialStepId?: string;
  onClose: () => void;
};

type ToastKind = "png" | "link" | "prompt" | "saved" | "fail" | null;

/**
 * Mobbin flow theater — comments toggle, working Save / Copy / More.
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
  const [prompt, setPrompt] = useState<string | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [toast, setToast] = useState<ToastKind>(null);
  /** Flows: stills until the researcher presses play */
  const [playing, setPlaying] = useState(false);

  const showToast = useCallback((kind: ToastKind) => {
    setToast(kind);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    setSaved(isFavorite(operator.slug));
    return subscribeCollections(() => setSaved(isFavorite(operator.slug)));
  }, [operator.slug]);

  useEffect(() => {
    if (!open || !flow) return;
    const idx = initialStepId
      ? Math.max(
          0,
          flow.steps.findIndex((s) => s.id === initialStepId),
        )
      : 0;
    setStep(idx === -1 ? 0 : idx);
    setPlaying(false);
    setPrompt(null);
    setCommentsOpen(true);
    try {
      setNote(localStorage.getItem(`blaast:flow-note:${flow.id}`) ?? "");
    } catch {
      setNote("");
    }
  }, [open, flow, initialStepId]);

  useEffect(() => {
    if (!open || !flow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      if (e.key === "ArrowRight")
        setStep((s) => Math.min(flow.steps.length - 1, s + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flow]);

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
    } finally {
      setPromptLoading(false);
    }
    const fallback = buildAgentPrompt(operator, flow, window.location.origin);
    setPrompt(fallback);
    return fallback;
  }, [flow, operator]);

  useEffect(() => {
    if (open && flow) void loadPrompt();
  }, [open, flow, loadPrompt]);

  const copyPrompt = useCallback(async () => {
    if (!mcp.requireMcp()) return;
    let text = prompt;
    if (!text) text = await loadPrompt();
    await navigator.clipboard.writeText(text);
    showToast("prompt");
  }, [prompt, loadPrompt, mcp, showToast]);

  const copyLink = useCallback(async () => {
    if (!flow) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/flows/${flow.id}`,
    );
    showToast("link");
  }, [flow, showToast]);

  const posterForStep = useCallback(() => {
    if (!flow) return null;
    const current = flow.steps[step];
    return (
      current?.posterUrl ?? flow.posterUrl ?? operator.posterUrl ?? null
    );
  }, [flow, step, operator.posterUrl]);

  const copyPng = useCallback(async () => {
    const url = posterForStep();
    if (!url || !flow) {
      showToast("fail");
      return;
    }
    const result = await copyImageAsPng(
      url,
      `${operator.slug}-${flow.id}-step-${step + 1}.png`,
    );
    showToast(result === "failed" ? "fail" : "png");
  }, [posterForStep, flow, operator.slug, step, showToast]);

  const downloadPng = useCallback(async () => {
    const url = posterForStep();
    if (!url || !flow) {
      showToast("fail");
      return;
    }
    const ok = await downloadImageUrl(
      url,
      `${operator.slug}-${flow.id}-step-${step + 1}.png`,
    );
    showToast(ok ? "png" : "fail");
  }, [posterForStep, flow, operator.slug, step, showToast]);

  if (!flow) return null;

  const total = flow.steps.length;
  const safeStep = Math.min(Math.max(0, step), Math.max(0, total - 1));
  const current = flow.steps[safeStep];
  const isMobile = operator.platform === "mobile";

  return (
    <LibraryOverlay
      open={open}
      onClose={onClose}
      size="wide"
      sideOpen={commentsOpen}
      sideTitle="Comments"
      headerLeft={
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[12px] text-[#8a8a8a]">
            {flow.group} in
            {operator.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={operator.logoUrl}
                alt=""
                className="size-4 rounded bg-white object-contain p-px"
              />
            ) : null}
            <span className="font-medium text-white">{operator.name}</span>
          </p>
          <p className="mt-0.5 truncate text-[16px] font-semibold text-white">
            {flow.name}
            <span className="ml-2 font-normal text-[#636363]">
              {safeStep + 1}/{Math.max(total, 1)}
            </span>
          </p>
        </div>
      }
      headerRight={
        <>
          <button
            type="button"
            aria-label={commentsOpen ? "Hide comments" : "Show comments"}
            aria-pressed={commentsOpen}
            onClick={() => setCommentsOpen((v) => !v)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-colors",
              commentsOpen
                ? "bg-white/[0.12] text-white"
                : "text-[#8a8a8a] hover:bg-white/[0.06] hover:text-white",
            )}
          >
            <MessageCircle className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Copy flow link"
            onClick={() => void copyLink()}
            className="flex size-9 items-center justify-center rounded-full text-[#8a8a8a] hover:bg-white/[0.06] hover:text-white"
          >
            <Link2 className="size-4" strokeWidth={1.75} />
          </button>
        </>
      }
      side={
        <div className="flex h-full min-h-[160px] flex-col gap-3">
          <p className="text-[13px] font-medium text-white">
            Add a note-to-self
          </p>
          <p className="text-[12px] text-[#8a8a8a]">
            Anything you want to remember for later?
          </p>
          <textarea
            value={note}
            onChange={(e) => {
              const v = e.target.value;
              setNote(v);
              try {
                localStorage.setItem(`blaast:flow-note:${flow.id}`, v);
              } catch {
                /* ignore */
              }
            }}
            placeholder="Add a comment…"
            className="min-h-[140px] flex-1 resize-none rounded-xl border-0 bg-white/[0.04] px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-[#636363] focus:ring-1 focus:ring-white/15"
          />
          <p className="text-[11px] text-[#636363]">
            This will automatically save the flow on this device.
          </p>
        </div>
      }
      footer={
        <div className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = toggleFavorite(operator.slug, flow.name);
              setSaved(next);
              showToast("saved");
            }}
            className={cn(
              "h-10 rounded-full px-5 text-[13px] font-semibold transition-colors",
              saved
                ? "bg-white text-[#111]"
                : "border border-white/15 text-white hover:bg-white/[0.06]",
            )}
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => void copyPng()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.1] px-5 text-[13px] font-medium text-white hover:bg-white/[0.14]"
          >
            <Copy className="size-3.5" strokeWidth={1.75} />
            Copy
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More actions"
              className="flex size-10 items-center justify-center rounded-full bg-white/[0.08] text-white outline-none hover:bg-white/[0.12] data-popup-open:bg-white/[0.14]"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[180px] border-white/10 bg-[#1a1a1a] text-white"
            >
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-[13px] focus:bg-white/[0.08] focus:text-white"
                onClick={() => void downloadPng()}
              >
                <Download className="size-3.5" />
                Download png
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-[13px] focus:bg-white/[0.08] focus:text-white"
                onClick={() => void copyLink()}
              >
                <Link2 className="size-3.5" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-[13px] focus:bg-white/[0.08] focus:text-white"
                disabled={promptLoading}
                onClick={() => void copyPrompt()}
              >
                <Copy className="size-3.5" />
                {mcp.allowed ? "Copy agent prompt" : "Copy agent prompt 🔒"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {toast && (
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.12] px-3.5 text-[12px] font-medium text-white">
              <Check className="size-3.5" strokeWidth={2} />
              {toast === "png" && "Copied as png"}
              {toast === "link" && "Link copied"}
              {toast === "prompt" && "Prompt copied"}
              {toast === "saved" && (saved ? "Saved" : "Removed")}
              {toast === "fail" && "Couldn’t copy image"}
            </span>
          )}

          <p className="ml-auto text-[11px] text-[#636363]">
            {isMobile ? "Mobile (390×844)" : "Web (1440×900)"}
            {current ? ` · ${current.label}` : ""}
          </p>
        </div>
      }
    >
      {!current ? (
        <p className="py-16 text-center text-[14px] text-[#8a8a8a]">
          No screens in this flow yet.
        </p>
      ) : (
        <div className="flex flex-col gap-5 pb-2">
          <div className="relative flex items-center justify-center gap-2 sm:gap-4">
            <button
              type="button"
              aria-label="Previous step"
              disabled={safeStep === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white disabled:opacity-25"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div
              className={cn(
                "mx-auto w-full overflow-hidden rounded-[20px] ring-1 ring-white/10",
                isMobile ? "max-w-[280px]" : "max-w-3xl",
              )}
            >
              <div
                className={cn(
                  "overflow-hidden bg-[#111]",
                  isMobile ? "aspect-[9/19]" : "aspect-[16/10]",
                )}
              >
                <div className="relative h-full w-full">
                  {current.email?.html ? (
                    <div className="flex h-full flex-col bg-[#E9EAEE]">
                      <div className="shrink-0 border-b border-black/5 bg-white px-4 py-3 text-left">
                        <p className="truncate text-[12px] text-neutral-500">
                          From {current.email.from}
                          {current.email.receivedAt
                            ? ` · ${new Date(current.email.receivedAt).toLocaleString()}`
                            : ""}
                        </p>
                        <p className="mt-0.5 truncate text-[14px] font-medium text-neutral-900">
                          {current.email.subject}
                        </p>
                      </div>
                      <iframe
                        title={current.email.subject}
                        sandbox=""
                        srcDoc={current.email.html}
                        className="min-h-0 w-full flex-1 bg-white"
                      />
                    </div>
                  ) : (
                    <>
                      <CaptureMedia
                        key={current.id}
                        posterUrl={
                          current.posterUrl ??
                          flow.posterUrl ??
                          operator.posterUrl
                        }
                        // Always pass video so missing posters still show a frame
                        videoUrl={
                          current.videoUrl ??
                          flow.videoUrl ??
                          operator.videoUrl
                        }
                        atMs={current.atMs}
                        region={current.region}
                        clipWindow={current.clipWindow}
                        label={`${safeStep + 1}. ${current.label}`}
                        playOnHover={false}
                        hovering={playing}
                        loop={playing}
                      />
                      {!playing &&
                        (current.videoUrl ||
                          flow.videoUrl ||
                          operator.videoUrl) && (
                          <button
                            type="button"
                            onClick={() => setPlaying(true)}
                            className="absolute inset-0 flex items-center justify-center bg-black/25 text-white transition hover:bg-black/35"
                            aria-label="Play step video"
                          >
                            <span className="inline-flex size-14 items-center justify-center rounded-full bg-white text-neutral-950 shadow-lg">
                              ▶
                            </span>
                          </button>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Next step"
              disabled={safeStep >= total - 1}
              onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white disabled:opacity-25"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <p className="text-center text-[13px] text-[#a3a3a3]">
            Found in{" "}
            <span className="text-white/80">{flow.group}</span>
            {flow.actions.length > 0 && (
              <span className="text-[#636363]">
                {" "}
                · {flow.actions.join(" → ")}
              </span>
            )}
          </p>

          {total > 1 && (
            <ul className="flex gap-2.5 overflow-x-auto px-1 py-2">
              {flow.steps.map((s, i) => {
                const active = i === safeStep;
                const poster =
                  s.posterUrl ||
                  (!s.videoUrl ? flow.posterUrl : undefined) ||
                  (!s.videoUrl ? operator.posterUrl : undefined);
                const video = s.videoUrl;
                const thumbAt = Math.max(
                  0.2,
                  (s.clipWindow?.startMs ?? s.atMs ?? 400) / 1000,
                );
                return (
                  <li key={s.id} className="shrink-0 p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPlaying(false);
                        setStep(i);
                      }}
                      className={cn(
                        "w-[120px] rounded-xl text-left transition",
                        active
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]"
                          : "ring-1 ring-white/10 hover:ring-white/25",
                      )}
                    >
                      <div className="overflow-hidden rounded-[10px]">
                        <div className="aspect-[16/10] bg-[#111]">
                          {poster ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt=""
                              src={poster}
                              className="h-full w-full object-cover"
                            />
                          ) : video ? (
                            <video
                              src={`${video}#t=${thumbAt.toFixed(2)}`}
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <p className="truncate bg-[#1a1a1a] px-2 py-1.5 text-[11px] text-white/80">
                          {i + 1}. {s.label}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </LibraryOverlay>
  );
}
