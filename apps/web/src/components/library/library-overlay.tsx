"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobbin-style theater shell — portaled to body so sticky/overflow chrome
 * never traps fixed overlays (that was breaking help / invite).
 */
export function LibraryOverlay({
  open,
  onClose,
  title,
  subtitle,
  headerLeft,
  headerRight,
  footer,
  side,
  sideOpen = true,
  sideTitle = "Comments",
  size = "theater",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  side?: ReactNode;
  /** When false, comments/notes panel is collapsed */
  sideOpen?: boolean;
  sideTitle?: string;
  size?: "dialog" | "theater" | "wide";
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const maxW =
    size === "dialog"
      ? "max-w-xl"
      : size === "wide"
        ? "max-w-6xl"
        : "max-w-5xl";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[94vh] w-full flex-col gap-3 sm:flex-row",
          maxW,
          className,
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#1a1a1a] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)]">
          <header className="flex shrink-0 items-start gap-3 px-5 pt-5 pb-3 sm:px-6">
            <div className="min-w-0 flex-1">
              {headerLeft ?? (
                <>
                  {subtitle ? (
                    <p className="text-[12px] text-[#8a8a8a]">{subtitle}</p>
                  ) : null}
                  {title ? (
                    <h2 className="mt-0.5 text-[18px] font-semibold tracking-tight text-white sm:text-[20px]">
                      {title}
                    </h2>
                  ) : null}
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerRight}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-full bg-white/[0.08] text-[#cfcfcf] transition-colors hover:bg-white/[0.12] hover:text-white"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
            {children}
          </div>

          {footer ? (
            <footer className="shrink-0 border-t border-white/[0.06] px-5 py-3.5 sm:px-6">
              {footer}
            </footer>
          ) : null}
        </div>

        {side && sideOpen ? (
          <aside className="flex max-h-[40vh] w-full shrink-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#1a1a1a] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)] sm:max-h-none sm:w-[280px]">
            <div className="border-b border-white/[0.06] px-4 py-3.5">
              <p className="text-[14px] font-semibold text-white">{sideTitle}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {side}
            </div>
          </aside>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function OverlayFaq({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="mb-3 text-[15px] font-semibold text-white">
        Frequently asked questions
      </h3>
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-2xl bg-white/[0.05] open:bg-white/[0.07]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[13px] font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            <span className="text-[#8a8a8a] transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <p className="px-4 pb-4 text-[13px] leading-relaxed text-[#a3a3a3]">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

export function OverlayStepCards({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((s, i) => (
        <div
          key={s.title}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-5"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white/[0.08] text-[13px] font-semibold text-white">
            {i + 1}
          </span>
          <p className="mt-3 text-[14px] font-semibold text-white">{s.title}</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#8a8a8a]">
            {s.body}
          </p>
        </div>
      ))}
    </div>
  );
}
