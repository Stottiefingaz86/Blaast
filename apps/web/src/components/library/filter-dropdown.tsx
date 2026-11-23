"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mobbin-style filter dropdown — portaled so sticky chrome never traps it. */
export function FilterDropdown({
  label,
  items,
  selected,
  onToggle,
  describe,
  searchPlaceholder,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  describe?: (item: string) => string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const active = selected.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = describe ? 480 : 260;
    const left = Math.min(
      Math.max(8, r.left),
      window.innerWidth - width - 8,
    );
    setPos({ top: r.bottom + 8, left });
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
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
      setQuery("");
      setHover(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setHover(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = items.filter((i) =>
    i.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const menu =
    open &&
    mounted &&
    pos &&
    createPortal(
      <div
        ref={menuRef}
        role="listbox"
        aria-multiselectable
        style={{ top: pos.top, left: pos.left }}
        className={cn(
          "fixed z-[220] flex max-h-[min(420px,70vh)] overflow-hidden rounded-2xl bg-[#1a1a1a]",
          "shadow-[0_24px_80px_-12px_rgba(0,0,0,0.75)] ring-1 ring-white/[0.08]",
          "animate-in fade-in-0 zoom-in-95 origin-top-left duration-150",
        )}
      >
        <div className="flex w-[260px] flex-col">
          <div className="shrink-0 border-b border-white/[0.06] px-3 py-2.5">
            <label className="flex items-center gap-2 text-[#636363]">
              <Search className="size-3.5 shrink-0" strokeWidth={1.75} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}…`}
                className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#636363]"
              />
            </label>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5">
            {filtered.map((item) => {
              const checked = selected.includes(item);
              return (
                <li key={item}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onMouseEnter={() => setHover(item)}
                    onClick={() => onToggle(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
                      checked || hover === item
                        ? "bg-white/[0.06] text-white"
                        : "text-[#cfcfcf] hover:bg-white/[0.04]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                        checked
                          ? "border-white bg-white text-[#111]"
                          : "border-white/25",
                      )}
                    >
                      {checked && (
                        <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                          <path
                            d="M2.5 6.2l2.4 2.4 4.6-5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {item}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-[12px] text-[#636363]">No matches</li>
            )}
          </ul>
        </div>

        {describe && (
          <div className="hidden w-[220px] shrink-0 border-l border-white/[0.06] p-4 sm:block">
            {hover ? (
              <>
                <div className="mb-3 grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-lg bg-gradient-to-br from-white/[0.1] to-white/[0.02] ring-1 ring-white/10"
                    />
                  ))}
                </div>
                <p className="text-[12px] leading-relaxed text-[#8a8a8a]">
                  {describe(hover)}
                </p>
              </>
            ) : (
              <p className="text-[12px] leading-relaxed text-[#636363]">
                Hover a category for a preview.
              </p>
            )}
          </div>
        )}
      </div>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={titleId}
        onClick={() => {
          setOpen((o) => !o);
          if (open) {
            setQuery("");
            setHover(null);
          }
        }}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors",
          active || open
            ? "border-white/25 bg-white/[0.06] text-[#f5f5f5]"
            : "border-white/[0.1] text-[#8a8a8a] hover:border-white/20 hover:text-[#d4d4d4]",
        )}
      >
        <span id={titleId}>
          {label}
          {active ? ` · ${selected.length}` : ""}
        </span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
          strokeWidth={1.75}
        />
      </button>
      {menu}
    </div>
  );
}

export function ActiveFilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/30 bg-transparent px-3 text-[12px] font-medium text-white">
      {label}
      <button
        type="button"
        aria-label={`Clear ${label}`}
        onClick={onClear}
        className="flex size-4 items-center justify-center rounded-full bg-white/15 text-[11px] leading-none text-white hover:bg-white/25"
      >
        ×
      </button>
    </span>
  );
}
