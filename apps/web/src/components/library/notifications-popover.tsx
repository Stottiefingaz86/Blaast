"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobbin-style notifications flyout — empty state until product notifications land.
 */
export function NotificationsPopover({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const updatePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setPos({
      top: r.bottom + 10,
      right: Math.max(8, window.innerWidth - r.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-[#8a8a8a] transition-colors duration-200 hover:bg-white/[0.04] hover:text-[#d4d4d4]",
          open && "bg-white/[0.06] text-white",
          className,
        )}
      >
        <Bell className="size-4" strokeWidth={1.75} />
      </button>

      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            className="fixed z-[220] w-[340px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1a1a1a] shadow-[0_20px_60px_-16px_rgba(0,0,0,0.65)]"
            style={{ top: pos.top, right: pos.right }}
          >
            <div className="border-b border-white/[0.06] px-4 py-3">
              <p className="text-[15px] font-semibold text-white">
                Notifications
              </p>
            </div>
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <Bell
                className="size-8 text-[#636363]"
                strokeWidth={1.5}
              />
              <p className="mt-4 text-[15px] font-medium text-white">
                No notifications yet
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#8a8a8a]">
                You&apos;ll get notified when someone replies or mentions you.
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
