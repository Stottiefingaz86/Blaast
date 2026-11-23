"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Monitor,
  Search,
  SlidersHorizontal,
  Smartphone,
  X,
} from "lucide-react";
import {
  ActiveFilterChip,
  FilterDropdown,
} from "@/components/library/filter-dropdown";
import {
  categoriesForContext,
  describeCategory,
  describeRegion,
  regionsForContext,
  uiElementsForContext,
} from "@/lib/library/context-filters";
import { cn } from "@/lib/utils";
import type { PlatformFilter, SortKey } from "@/lib/library/taxonomy-nav";

const sorts: { id: SortKey; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "popular", label: "Most popular" },
  { id: "rated", label: "Top rated" },
  { id: "animations", label: "Animations" },
];

function toggleIn(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

/**
 * Mobbin filter row:
 * default → platform · sorts · Filter
 * after a primary pick → platform · Categories · chip · UI Elements · Region · capture search · Filter
 */
export function DiscoverToolbar({
  platform,
  sort,
  videosOnly,
  onPlatform,
  onSort,
  onVideosOnly,
  filterChip,
  onClearFilter,
  onOpenFilter,
  filterCount = 0,
  categories = [],
  uiElements = [],
  regions = [],
  onToggleCategory,
  onToggleUiElement,
  onToggleRegion,
  mediaQuery = "",
  onMediaQuery,
  resultCount,
  className,
  dense,
}: {
  platform: PlatformFilter;
  sort: SortKey;
  videosOnly: boolean;
  onPlatform: (p: PlatformFilter) => void;
  onSort: (s: SortKey) => void;
  onVideosOnly: (v: boolean) => void;
  filterChip?: string | null;
  onClearFilter?: () => void;
  onOpenFilter?: () => void;
  filterCount?: number;
  categories?: string[];
  uiElements?: string[];
  regions?: string[];
  onToggleCategory?: (item: string) => void;
  onToggleUiElement?: (item: string) => void;
  onToggleRegion?: (item: string) => void;
  mediaQuery?: string;
  onMediaQuery?: (q: string) => void;
  resultCount?: number;
  className?: string;
  dense?: boolean;
}) {
  const contextual = Boolean(filterChip) || filterCount > 0;
  const primary = filterChip ?? null;
  const categoryItems = categoriesForContext(primary);
  const uiItems = uiElementsForContext(primary);
  const regionItems = regionsForContext(primary);
  const [mediaOpen, setMediaOpen] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mediaOpen) return;
    inputRef.current?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!mediaRef.current?.contains(e.target as Node)) setMediaOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [mediaOpen]);

  const mediaActive = videosOnly || mediaQuery.trim().length > 0;

  return (
    <div
      className={cn(
        "mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2 px-5",
        dense ? "h-14" : "py-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-0.5">
        {(
          [
            ["mobile", Smartphone, "Mobile"],
            ["web", Monitor, "Web"],
          ] as const
        ).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-pressed={platform === id}
            onClick={() => onPlatform(id)}
            className={cn(
              "flex size-9 items-center justify-center rounded-xl transition-all duration-200",
              platform === id
                ? "bg-white text-[#111]"
                : "text-[#8a8a8a] hover:bg-white/[0.05] hover:text-[#d4d4d4]",
            )}
          >
            <Icon className="size-5" strokeWidth={1.6} />
          </button>
        ))}
      </div>

      <span className="hidden h-5 w-px bg-white/[0.08] sm:block" aria-hidden />

      {!contextual ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-0.5 gap-y-1">
          {sorts.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSort(s.id)}
              className={cn(
                "relative px-2.5 py-2 text-[13px] font-medium transition-colors duration-200",
                sort === s.id
                  ? "text-[#f5f5f5]"
                  : "lib-muted hover:text-[#d4d4d4]",
              )}
            >
              {s.label}
              {sort === s.id && (
                <span className="absolute inset-x-2.5 bottom-0 h-px rounded-full bg-[#f5f5f5]" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <FilterDropdown
            label="Categories"
            items={categoryItems}
            selected={categories}
            onToggle={(item) => onToggleCategory?.(item)}
            describe={describeCategory}
            searchPlaceholder="Search categories…"
          />

          {filterChip && (
            <ActiveFilterChip label={filterChip} onClear={() => onClearFilter?.()} />
          )}

          <FilterDropdown
            label="UI Elements"
            items={uiItems}
            selected={uiElements}
            onToggle={(item) => onToggleUiElement?.(item)}
            searchPlaceholder="Search UI elements…"
          />

          <FilterDropdown
            label="Region"
            items={regionItems}
            selected={regions}
            onToggle={(item) => onToggleRegion?.(item)}
            describe={describeRegion}
            searchPlaceholder="Search markets…"
          />

          {/* Capture search — keywords across screenshots + videos */}
          <div ref={mediaRef} className="relative flex items-center gap-1.5">
            <button
              type="button"
              title="Search captures"
              aria-pressed={mediaActive || mediaOpen}
              onClick={() => {
                setMediaOpen((o) => !o);
                if (!videosOnly) onVideosOnly(true);
              }}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-2.5 transition-all duration-200",
                mediaActive || mediaOpen
                  ? "bg-white text-[#111]"
                  : "text-[#8a8a8a] hover:bg-white/[0.05] hover:text-[#d4d4d4]",
              )}
            >
              <Clapperboard className="size-4" strokeWidth={1.6} />
              <span className="hidden text-[12px] font-medium sm:inline">
                Captures
              </span>
            </button>

            {(mediaOpen || mediaQuery) && (
              <div
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-[#141414] pl-2.5 pr-1",
                  mediaOpen
                    ? "absolute top-[calc(100%+8px)] left-0 z-[140] w-[min(320px,80vw)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)] sm:relative sm:top-0 sm:w-[220px] sm:shadow-none"
                    : "w-[160px] sm:w-[200px]",
                )}
              >
                <Search className="size-3.5 shrink-0 text-[#636363]" strokeWidth={1.75} />
                <input
                  ref={inputRef}
                  value={mediaQuery}
                  onChange={(e) => onMediaQuery?.(e.target.value)}
                  placeholder="Keywords in captures…"
                  className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-[#636363]"
                />
                {mediaQuery && (
                  <button
                    type="button"
                    aria-label="Clear capture search"
                    onClick={() => onMediaQuery?.("")}
                    className="flex size-6 items-center justify-center rounded-full text-[#8a8a8a] hover:bg-white/[0.06] hover:text-white"
                  >
                    <X className="size-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        {contextual && typeof resultCount === "number" && (
          <p className="hidden text-[12px] text-[#636363] sm:block">
            Showing {resultCount.toLocaleString()}{" "}
            {resultCount === 1 ? "result" : "results"}
          </p>
        )}
        <button
          type="button"
          onClick={onOpenFilter}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-all duration-200",
            filterCount > 0
              ? "bg-[#f5f5f5] text-[#111]"
              : "text-[#8a8a8a] hover:bg-white/[0.05] hover:text-[#d4d4d4]",
          )}
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={1.75} />
          Filter{filterCount > 0 ? ` · ${filterCount}` : ""}
        </button>
      </div>
    </div>
  );
}

export { toggleIn };
