"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
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
import { buildElementPrompt } from "@/lib/library/element-prompt";
import type { CatalogOperator, CatalogUiElement } from "@/lib/library/catalog";
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
  element: CatalogUiElement | null;
  onClose: () => void;
};

type ToastKind = "png" | "link" | "prompt" | "saved" | "fail" | null;

/**
 * Mobbin-style UI element theater — comments toggle + working actions only.
 */
export function ElementPromptModal({
  open,
  operator,
  element,
  onClose,
}: Props) {
  const mcp = useMcpAccess();
  const [prompt, setPrompt] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [toast, setToast] = useState<ToastKind>(null);

  const showToast = useCallback((kind: ToastKind) => {
    setToast(kind);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    setSaved(isFavorite(operator.slug));
    return subscribeCollections(() => setSaved(isFavorite(operator.slug)));
  }, [operator.slug]);

  useEffect(() => {
    if (!open || !element) return;
    setPrompt(buildElementPrompt(operator, element, window.location.origin));
    setCommentsOpen(true);
    try {
      setNote(
        localStorage.getItem(`blaast:ui-note:${operator.slug}:${element.id}`) ??
          "",
      );
    } catch {
      setNote("");
    }
  }, [open, element, operator]);

  const copyPrompt = useCallback(async () => {
    if (!mcp.requireMcp()) return;
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    showToast("prompt");
  }, [prompt, mcp, showToast]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    showToast("link");
  }, [showToast]);

  const imageUrl = element?.posterUrl ?? operator.posterUrl ?? null;

  const copyPng = useCallback(async () => {
    if (!imageUrl || !element) {
      showToast("fail");
      return;
    }
    const result = await copyImageAsPng(
      imageUrl,
      `${operator.slug}-${element.id}.png`,
    );
    showToast(result === "failed" ? "fail" : "png");
  }, [imageUrl, element, operator.slug, showToast]);

  const downloadPng = useCallback(async () => {
    if (!imageUrl || !element) {
      showToast("fail");
      return;
    }
    const ok = await downloadImageUrl(
      imageUrl,
      `${operator.slug}-${element.id}.png`,
    );
    showToast(ok ? "png" : "fail");
  }, [imageUrl, element, operator.slug, showToast]);

  if (!element) return null;

  const isMotion = /loader|skeleton/i.test(element.name);
  const hasTrim = element.clipWindow != null || element.atMs != null;
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
            UI element in
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
            {element.name}
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
            aria-label="Copy page link"
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
                localStorage.setItem(
                  `blaast:ui-note:${operator.slug}:${element.id}`,
                  v,
                );
              } catch {
                /* ignore */
              }
            }}
            placeholder="Add a comment…"
            className="min-h-[120px] flex-1 resize-none rounded-xl border-0 bg-white/[0.04] px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-[#636363] focus:ring-1 focus:ring-white/15"
          />
          <div>
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-[#636363] uppercase">
              Replicate prompt
            </p>
            <pre className="max-h-36 overflow-auto rounded-xl bg-black/40 p-2.5 text-[10px] leading-relaxed whitespace-pre-wrap text-[#a3a3a3]">
              {prompt}
            </pre>
          </div>
        </div>
      }
      footer={
        <div className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = toggleFavorite(operator.slug, element.name);
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
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-[#111]"
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
          </p>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 pb-2 pt-2">
        <div
          className={cn(
            "overflow-hidden rounded-[20px] ring-1 ring-white/10",
            isMobile
              ? "aspect-[9/19] w-full max-w-[260px]"
              : "aspect-[16/10] w-full max-w-3xl",
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
        <p className="text-center text-[13px] text-[#8a8a8a]">
          Found in{" "}
          <span className="text-white/80">
            {element.category ?? "UI Elements"}
          </span>
        </p>
      </div>
    </LibraryOverlay>
  );
}
