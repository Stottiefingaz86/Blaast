"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/library/site-header";
import { MegaBrowse } from "@/components/library/mega-browse";
import {
  DiscoverToolbar,
  toggleIn,
} from "@/components/library/discover-toolbar";
import { PreviewCard } from "@/components/library/preview-card";
import {
  EMPTY_FILTERS,
  FilterPanel,
  type FilterState,
} from "@/components/library/filter-panel";
import { LibrarySkeleton } from "@/components/brand/blaast-preloader";
import type { CatalogOperator } from "@/lib/library/catalog";
import { migrateLegacySaved } from "@/lib/library/collections-store";
import {
  flowMatchesJourneyFilter,
  operatorSearchHaystack,
} from "@/lib/library/journeys";
import { belongsToScreenChip } from "@/lib/library/tag-catalog";
import type { PlatformFilter, SortKey } from "@/lib/library/taxonomy-nav";
import { cn } from "@/lib/utils";

/**
 * Mobbin scroll chrome — library grid is published captures only (no demos).
 */
export function DiscoverPage() {
  const searchParams = useSearchParams();
  const platformParam = searchParams.get("platform");
  const [platform, setPlatform] = useState<PlatformFilter>(
    platformParam === "mobile" ? "mobile" : "web",
  );
  const [sort, setSort] = useState<SortKey>("popular");
  const [videosOnly, setVideosOnly] = useState(false);
  const [mediaQuery, setMediaQuery] = useState("");
  const [filterChip, setFilterChip] = useState<string | null>(null);
  const [filterPinned, setFilterPinned] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [catalog, setCatalog] = useState<CatalogOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const filterSentinelRef = useRef<HTMLDivElement>(null);
  const filteredMode = Boolean(filterChip);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/library/catalog");
        const data = (await res.json()) as { operators?: CatalogOperator[] };
        const ops = data.operators ?? [];
        if (!cancelled) {
          setCatalog(ops);
          migrateLegacySaved(ops.map((o) => o.slug));
        }
      } catch {
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (platformParam === "mobile" || platformParam === "web") {
      setPlatform(platformParam);
    }
  }, [platformParam]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFilterOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = filterSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setFilterPinned(!entry.isIntersecting && entry.boundingClientRect.top < 56);
      },
      { root: null, rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const filterCount =
    filters.categories.length +
    filters.screens.length +
    filters.uiElements.length +
    filters.flows.length +
    filters.regions.length +
    (filters.platform !== "any" ? 1 : 0);

  const clearPrimary = () => {
    setFilterChip(null);
    setVideosOnly(false);
    setMediaQuery("");
    setFilters((f) => ({
      ...f,
      categories: [],
      uiElements: [],
      regions: [],
      screens: [],
      flows: [],
    }));
  };

  const matchesChip = (p: CatalogOperator, chip: string) => {
    const needle = chip.toLowerCase();
    const uiHay = (u: { name: string; tags?: string[]; searchText?: string; category?: string }) =>
      `${u.name} ${u.category ?? ""} ${u.searchText ?? ""} ${(u.tags ?? []).join(" ")}`.toLowerCase();

    // Screen filters (Home, Onboarding, …) — match that surface, not sports hero
    if (needle === "home") {
      return p.screens.some((s) =>
        /home|landing/i.test(`${s.title} ${(s.tags ?? []).join(" ")}`),
      );
    }
    // Rewards & VIP — screens/UI/flows tagged rewards, not the whole brand hero
    if (
      needle === "rewards & vip" ||
      needle === "rewards" ||
      needle === "vip"
    ) {
      return (
        /reward|vip|loyalty/i.test(p.category) ||
        p.screens.some((s) =>
          /vip|reward|loyalty|promo|bonus/i.test(
            `${s.title} ${s.category ?? ""} ${(s.tags ?? []).join(" ")} ${s.journey ?? ""}`,
          ),
        ) ||
        p.uiElements.some((u) =>
          /vip|reward|loyalty|promo|bonus/i.test(uiHay(u)),
        ) ||
        p.flows.some((f) =>
          flowMatchesJourneyFilter(f, "Loyalty & Rewards"),
        )
      );
    }
    // Animation / loader / skeleton — only elements whose *name or primary tag* matches
    if (
      needle === "animation" ||
      needle === "loader" ||
      needle === "skeleton"
    ) {
      return p.uiElements.some((u) => {
        const primary = `${u.name} ${u.tags?.[0] ?? ""}`.toLowerCase();
        if (needle === "animation") {
          return /^(animation|motion)\b|\banimation\b|\bmotion\b/.test(primary);
        }
        if (needle === "loader") {
          return /\b(loader|spinner)\b/.test(primary) && !/\bskeleton\b/.test(primary);
        }
        return /\b(skeleton|shimmer|loading.?skeleton)\b/.test(primary);
      });
    }
    if (
      needle === "onboarding" ||
      needle === "sign up" ||
      needle === "signup" ||
      needle === "first time deposit" ||
      needle === "withdrawal" ||
      needle === "casino lobby" ||
      needle === "bingo lobby" ||
      needle === "sports betslip" ||
      needle === "loyalty & rewards" ||
      needle === "support" ||
      needle === "my account"
    ) {
      return (
        p.flows.some((f) => flowMatchesJourneyFilter(f, needle)) ||
        p.screens.some((s) => {
          const hay = `${s.title} ${(s.tags ?? []).join(" ")}`.toLowerCase();
          if (needle.includes("onboard") || needle.includes("sign"))
            return /login|register|sign|onboard|welcome/.test(hay);
          if (needle.includes("deposit")) return /deposit|cashier/.test(hay);
          if (needle.includes("withdraw")) return /withdraw/.test(hay);
          if (needle.includes("loyalty") || needle.includes("reward"))
            return /vip|reward|loyalty|promo/i.test(hay);
          return hay.includes(needle);
        }) ||
        p.uiElements.some((u) =>
          belongsToScreenChip(needle, {
            name: u.name,
            tags: u.tags,
            searchText: u.searchText,
            parentScreen: u.parentScreen,
          }),
        )
      );
    }
    // Betslip (and similar) — include parented UI: single, combo, SGP, closed
    if (needle === "betslip") {
      return (
        p.screens.some((s) =>
          /betslip/i.test(`${s.title} ${(s.tags ?? []).join(" ")} ${s.id}`),
        ) ||
        p.uiElements.some((u) =>
          belongsToScreenChip("betslip", {
            name: u.name,
            tags: u.tags,
            searchText: u.searchText,
            parentScreen: u.parentScreen,
          }),
        ) ||
        p.flows.some((f) => flowMatchesJourneyFilter(f, "Sports Betslip"))
      );
    }
    return (
      p.category.toLowerCase().includes(needle) ||
      p.screens.some((s) => s.title.toLowerCase().includes(needle)) ||
      p.uiElements.some((u) =>
        belongsToScreenChip(needle, {
          name: u.name,
          tags: u.tags,
          searchText: u.searchText,
          parentScreen: u.parentScreen,
        }),
      ) ||
      p.flows.some((f) => flowMatchesJourneyFilter(f, needle))
    );
  };

  const matchesMediaQuery = (p: CatalogOperator, q: string) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    const hay = operatorSearchHaystack(p);
    return needle.split(/\s+/).every((word) => hay.includes(word));
  };

  const items = useMemo(() => {
    const plat =
      filters.platform !== "any" ? filters.platform : platform;

    let list = filterChip
      ? [...catalog]
      : catalog.filter((p) => p.platform === plat);
    if (!filterChip && list.length === 0) list = [...catalog];

    if (filterChip) {
      list = list.filter((p) => matchesChip(p, filterChip));
      const onPlat = list.filter((p) => p.platform === plat);
      if (onPlat.length) list = onPlat;
    }

    if (videosOnly) {
      list = list.filter((p) => p.hasVideo);
    }
    // Animations sort = operators that actually tagged an Animation moment
    if (sort === "animations") {
      list = list.filter((p) =>
        p.uiElements.some((u) =>
          /^(animation|motion)$/i.test(u.name.trim()) ||
          /^(animation|motion)$/i.test((u.tags?.[0] ?? "").trim()),
        ),
      );
    }

    if (mediaQuery.trim()) {
      list = list.filter((p) => matchesMediaQuery(p, mediaQuery));
    }

    if (filters.categories.length) {
      list = list.filter((p) =>
        filters.categories.some((c) => {
          const needle = c.toLowerCase();
          if (needle === "horse racing" || needle === "exchange") {
            return (
              p.kind === "sportsbook" ||
              p.category.toLowerCase().includes("sport")
            );
          }
          if (needle === "live casino") {
            return p.kind === "casino" || p.category.toLowerCase().includes("casino");
          }
          return (
            p.category.toLowerCase().includes(needle) ||
            p.kind.toLowerCase().includes(needle)
          );
        }),
      );
    }

    if (filters.screens.length) {
      list = list.filter((p) =>
        filters.screens.some((s) =>
          p.screens.some((x) => x.title.toLowerCase().includes(s.toLowerCase())),
        ),
      );
    }

    if (filters.uiElements.length) {
      list = list.filter((p) =>
        filters.uiElements.some((u) => {
          const needle = u.toLowerCase();
          return (
            p.uiElements.some((x) => x.name.toLowerCase().includes(needle)) ||
            p.screens.some((s) => s.title.toLowerCase().includes(needle)) ||
            p.tagline.toLowerCase().includes(needle)
          );
        }),
      );
    }

    if (filters.flows.length) {
      list = list.filter((p) =>
        filters.flows.some((f) =>
          p.flows.some((x) => flowMatchesJourneyFilter(x, f)),
        ),
      );
    }

    const richness = (p: CatalogOperator) =>
      p.screens.length * 3 +
      p.uiElements.length +
      p.flows.length +
      (p.hasVideo ? 5 : 0);
    if (sort === "rated" || sort === "popular") {
      list = [...list].sort((a, b) => richness(b) - richness(a));
    } else if (sort === "latest") {
      list = [...list].reverse();
    }
    return list;
  }, [catalog, platform, sort, videosOnly, filterChip, filters, mediaQuery]);

  useEffect(() => {
    if (filterCount === 0 && !filterChip && videosOnly) {
      setVideosOnly(false);
      setMediaQuery("");
    }
  }, [filterCount, filterChip, videosOnly]);

  const toolbarProps = {
    platform,
    sort,
    videosOnly,
    onPlatform: setPlatform,
    onSort: setSort,
    onVideosOnly: setVideosOnly,
    filterChip,
    onClearFilter: clearPrimary,
    onOpenFilter: () => setFilterOpen(true),
    filterCount,
    categories: filters.categories,
    uiElements: filters.uiElements,
    regions: filters.regions,
    onToggleCategory: (item: string) =>
      setFilters((f) => ({ ...f, categories: toggleIn(f.categories, item) })),
    onToggleUiElement: (item: string) =>
      setFilters((f) => ({ ...f, uiElements: toggleIn(f.uiElements, item) })),
    onToggleRegion: (item: string) =>
      setFilters((f) => ({ ...f, regions: toggleIn(f.regions, item) })),
    mediaQuery,
    onMediaQuery: setMediaQuery,
    resultCount: items.length,
  };

  return (
    <div className="lib-surface animate-fade-in min-h-screen">
      <div className="lib-chrome lib-hairline sticky top-0 z-[100] h-14 border-b">
        <div className="relative h-14 overflow-hidden">
          <div
            className={cn(
              "absolute inset-x-0 top-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              filterPinned
                ? "-translate-y-full opacity-0"
                : "translate-y-0 opacity-100",
            )}
          >
            <SiteHeader
              tab="library"
              searchPlaceholder={
                platform === "mobile" ? "Search on Mobile…" : "Search on Web…"
              }
              onSearchOpen={() => setFilterOpen(true)}
            />
          </div>
          <div
            className={cn(
              "absolute inset-x-0 top-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              filterPinned
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0",
            )}
            aria-hidden={!filterPinned}
          >
            <DiscoverToolbar {...toolbarProps} dense />
          </div>
        </div>
      </div>

      {!filteredMode && (
        <MegaBrowse
          operators={catalog}
          active={filterChip}
          onPick={(label) => {
            setFilterChip(label);
            setFilters((f) => ({
              ...f,
              categories: [],
              uiElements: [],
              regions: [],
            }));
            setVideosOnly(false);
            setMediaQuery("");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      <div ref={filterSentinelRef}>
        <div
          className={cn(
            "lib-hairline border-b",
            filteredMode && "lib-chrome sticky top-14 z-[90]",
            filterPinned && !filteredMode && "invisible pointer-events-none",
          )}
        >
          <DiscoverToolbar {...toolbarProps} />
        </div>
      </div>

      {loading ? (
        <LibrarySkeleton className="!min-h-0 px-0 pt-6" />
      ) : items.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
          <p className="text-[15px] font-medium text-white">
            No published captures yet
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8a8a8a]">
            Approve clips in Capture Desk — they show here with real video and
            Brandfetch logos. Demo mockups are gone.
          </p>
          <Link
            href="/admin/capture"
            className="mt-6 inline-flex h-10 items-center rounded-full bg-white px-5 text-[13px] font-medium text-[#111]"
          >
            Open Capture Desk
          </Link>
        </div>
      ) : (
        <div className="relative z-0 isolate mx-auto grid max-w-[1400px] grid-cols-1 gap-x-6 gap-y-10 px-5 pt-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={`${item.slug}-${filterChip ?? filters.screens[0] ?? filters.uiElements[0] ?? "all"}`}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <PreviewCard
                operator={item}
                focusChip={
                  filterChip ??
                  filters.screens[0] ??
                  filters.uiElements[0] ??
                  filters.flows[0] ??
                  null
                }
              />
            </div>
          ))}
        </div>
      )}

      <FilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        operators={catalog}
        onApply={(next) => {
          setFilters(next);
          const primary =
            next.screens[0] ?? next.uiElements[0] ?? next.flows[0] ?? null;
          if (primary) setFilterChip(primary);
        }}
        onPickBrand={(name) => {
          setMediaQuery(name);
          setFilterChip(null);
          setFilterOpen(false);
        }}
        resultCount={items.length}
      />
    </div>
  );
}
