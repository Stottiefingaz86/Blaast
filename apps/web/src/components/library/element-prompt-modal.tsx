"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, X } from "lucide-react";
import { CaptureMedia } from "@/components/library/capture-media";
import { buildElementPrompt } from "@/lib/library/element-prompt";
import type { CatalogOperator, CatalogUiElement } from "@/lib/library/catalog";
import { useMcpAccess } from "@/lib/platform/mcp-access";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  operator: CatalogOperator;
  element: CatalogUiElement | null;
  onClose: () => void;
};

/**
 * Mobbin-style element viewer: preview + copy replicate prompt for this UI piece.
 */
export function ElementPromptModal({
  open,
  operator,
  element,
  onClose,
}: Props) {
  const mcp = useMcpAccess();
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !element) return;
    setPrompt(buildElementPrompt(operator, element, window.location.origin));
    setCopied(false);
  }, [open, element, operator]);

  const copy = useCallback(async () => {
    if (!mcp.requireMcp()) return;
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [prompt, mcp]);

  if (!open || !element) return null;

  const isMotion = /loader|skeleton/i.test(element.name);
  const hasTrim = element.clipWindow != null || element.atMs != null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/45">
              {operator.name} · UI element
            </p>
            <p className="truncate text-[16px] font-semibold text-white">
              {element.name}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-neutral-950 hover:bg-white/90"
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
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1.1fr_1fr]">
          <div className="border-b border-white/10 p-4 md:border-r md:border-b-0">
            <div
              className={cn(
                "mx-auto overflow-hidden rounded-2xl ring-1 ring-white/10",
                operator.platform === "mobile"
                  ? "aspect-[9/19] max-w-[220px]"
                  : "aspect-[16/10] w-full",
              )}
            >
              <CaptureMedia
                posterUrl={element.posterUrl ?? operator.posterUrl}
                videoUrl={element.videoUrl}
                clipWindow={element.clipWindow}
                atMs={element.atMs}
                region={element.region}
                label={element.name}
                loop={isMotion || hasTrim}
                playOnHover={!(isMotion || hasTrim)}
                hovering
              />
            </div>
            <p className="mt-3 text-[12px] text-white/40">
              Click <strong className="font-medium text-white/70">Copy prompt</strong>{" "}
              to paste into Cursor / your design agent.
            </p>
          </div>

          <div className="flex min-h-0 flex-col p-4">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-white/45 uppercase">
              Replicate prompt
            </p>
            <pre className="min-h-[200px] flex-1 overflow-auto rounded-xl bg-black/50 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-white/80">
              {prompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
