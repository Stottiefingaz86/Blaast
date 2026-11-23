"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Flame,
  Layers,
  Monitor,
  Route,
  Search,
  Smartphone,
  TrendingUp,
  Waypoints,
} from "lucide-react";
import { CATALOG } from "@/lib/library/catalog";
import { MEGA } from "@/lib/library/taxonomy-nav";
import type { PlatformFilter } from "@/lib/library/taxonomy-nav";
import { cn } from "@/lib/utils";

export type FilterState = {
  categories: string[];
  screens: string[];
  uiElements: string[];
  flows: string[];
  regions: string[];
  platform: PlatformFilter | "any";
};

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  screens: [],
  uiElements: [],
  flows: [],
  regions: [],
  platform: "any",
};

type NavSection = "trending" | "categories" | "screens" | "uiElements" | "flows";

const NAV: {
  id: NavSection;
  label: string;
  icon: ReactNode;
}[] = [
  { id: "trending", label: "Trending", icon: <TrendingUp className="size-4" strokeWidth={1.75} /> },
  { id: "categories", label: "Categories", icon: <Box className="size-4" strokeWidth={1.75} /> },
  { id: "screens", label: "Screens", icon: <Layers className="size-4" strokeWidth={1.75} /> },
  {
    id: "uiElements",
    label: "UI Elements",
    icon: (
      <span className="relative flex size-4 items-center justify-center">
        <span className="size-3.5 rounded-[5px] border border-current" />
        <span className="absolute size-1.5 rounded-full bg-current" />
      </span>
    ),
  },
  { id: "flows", label: "Flows", icon: <Route className="size-4" strokeWidth={1.75} /> },
];

const SCREEN_GROUPS: { label: string; items: string[] }[] = [
  {
    label: "Sportsbook",
    items: ["Home", "Betslip", "Event view"],
  },
  {
    label: "Casino & poker",
    items: ["Casino lobby"],
  },
  {
    label: "Cashier",
    items: ["Deposit"],
  },
  {
    label: "Account",
    items: ["Login", "My account"],
  },
];

const FLOW_GROUPS: { label: string; items: string[] }[] = [
  {
    label: "Core journeys",
    items: ["Place a bet", "First deposit", "Onboarding"],
  },
  {
    label: "Money movement",
    items: ["Withdrawal", "Cash out"],
  },
  {
    label: "Retention",
    items: ["Bonus claim"],
  },
];

function toggleIn(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

function selectedCount(f: FilterState) {
  return (
    f.categories.length +
    f.screens.length +
    f.uiElements.length +
    f.flows.length +
    f.regions.length +
    (f.platform !== "any" ? 1 : 0)
  );
}

function countForLabel(kind: NavSection, label: string) {
  if (kind === "categories") {
    return CATALOG.filter((o) => o.category === label).length;
  }
  if (kind === "screens") {
    return CATALOG.reduce(
      (n, o) => n + o.screens.filter((s) => s.title === label).length,
      0,
    );
  }
  if (kind === "uiElements") {
    return CATALOG.reduce((n, o) => {
      const hit = o.uiElements.find((u) => u.name === label);
      return n + (hit?.count ?? 0);
    }, 0);
  }
  if (kind === "flows") {
    return CATALOG.reduce(
      (n, o) => n + o.flows.filter((f) => f.name === label).length,
      0,
    );
  }
  return 0;
}

/**
 * Mobbin browse modal — search · platform icons · sidebar · content pane.
 * Replaces the old stacked chip sheet.
 */
export function FilterPanel({
  open,
  onOpenChange,
  value,
  onApply,
  resultCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FilterState;
  onApply: (next: FilterState) => void;
  resultCount: number;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState(value);
  const [section, setSection] = useState<NavSection>("trending");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(value);
      setQuery("");
      setSection("trending");
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  const count = useMemo(() => selectedCount(draft), [draft]);

  const applyAndClose = (next: FilterState = draft) => {
    onApply(next);
    onOpenChange(false);
  };

  const pickTaxonomy = (
    key: "categories" | "screens" | "uiElements" | "flows",
    item: string,
  ) => {
    const next = {
      ...draft,
      [key]: toggleIn(draft[key], item),
    };
    setDraft(next);
  };

  if (!open) return null;

  const platformLabel =
    draft.platform === "mobile"
      ? "Mobile"
      : draft.platform === "web"
        ? "Web"
        : "All";

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[10vh] sm:px-6">
      <button
        type="button"
        aria-label="Close browse"
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex h-[min(640px,78vh)] w-full max-w-[880px] flex-col overflow-hidden",
          "rounded-[24px] bg-[#1a1a1a] text-[#f5f5f5]",
          "shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.08]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
      >
        {/* Top search + platform */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <label className="flex min-w-0 flex-1 items-center gap-2.5">
            <Search className="size-4 shrink-0 text-[#636363]" strokeWidth={1.75} />
            <input
              id={titleId}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                draft.platform === "mobile"
                  ? "Search Mobile…"
                  : draft.platform === "web"
                    ? "Search Web…"
                    : "Search library…"
              }
              className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-[#636363]"
            />
          </label>

          <div className="flex items-center gap-0.5">
            {(
              [
                ["mobile", Smartphone, "Mobile"],
                ["web", Monitor, "Web"],
                ["any", Flame, "What's hot"],
              ] as const
            ).map(([id, Icon, title]) => (
              <button
                key={id}
                type="button"
                title={title}
                aria-pressed={draft.platform === id}
                onClick={() => setDraft((d) => ({ ...d, platform: id }))}
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl transition-colors",
                  draft.platform === id
                    ? "bg-white text-[#111]"
                    : "text-[#8a8a8a] hover:bg-white/[0.06] hover:text-[#d4d4d4]",
                )}
              >
                <Icon className="size-5" strokeWidth={1.6} />
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <aside className="flex w-[200px] shrink-0 flex-col gap-0.5 border-r border-white/[0.06] p-2.5 sm:w-[220px]">
            {count > 0 && (
              <div className="mb-1.5 flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-2.5 py-2">
                <span className="text-[12px] font-medium text-white">{platformLabel}</span>
                <span className="ml-auto flex size-5 items-center justify-center rounded-md bg-white/[0.1] text-[11px] font-semibold tabular-nums">
                  {count}
                </span>
              </div>
            )}
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium transition-colors",
                  section === item.id
                    ? "bg-white/[0.08] text-white"
                    : "text-[#8a8a8a] hover:bg-white/[0.04] hover:text-[#d4d4d4]",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="mt-auto px-2 pb-1 pt-3">
              <button
                type="button"
                disabled={count === 0}
                onClick={() => setDraft(EMPTY_FILTERS)}
                className={cn(
                  "text-[12px] font-medium transition-colors",
                  count === 0
                    ? "text-[#3f3f3f]"
                    : "text-[#8a8a8a] hover:text-white",
                )}
              >
                Clear filters
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {section === "trending" && (
              <TrendingPane
                query={query}
                selected={draft}
                onPickCategory={(item) => pickTaxonomy("categories", item)}
                onPickScreen={(item) => pickTaxonomy("screens", item)}
                onPickUi={(item) => pickTaxonomy("uiElements", item)}
              />
            )}
            {section === "categories" && (
              <ListPane
                title="Categories"
                items={[...MEGA.categories]}
                selected={draft.categories}
                query={query}
                kind="categories"
                onToggle={(item) => pickTaxonomy("categories", item)}
              />
            )}
            {section === "screens" && (
              <GroupedListPane
                groups={SCREEN_GROUPS}
                selected={draft.screens}
                query={query}
                kind="screens"
                onToggle={(item) => pickTaxonomy("screens", item)}
              />
            )}
            {section === "uiElements" && (
              <ListPane
                title="UI Elements"
                items={[...MEGA.uiElements]}
                selected={draft.uiElements}
                query={query}
                kind="uiElements"
                onToggle={(item) => pickTaxonomy("uiElements", item)}
              />
            )}
            {section === "flows" && (
              <GroupedListPane
                groups={FLOW_GROUPS}
                selected={draft.flows}
                query={query}
                kind="flows"
                onToggle={(item) => pickTaxonomy("flows", item)}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => applyAndClose()}
            className="flex h-11 w-full items-center justify-center rounded-full bg-white text-[14px] font-semibold text-[#111] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            Show {resultCount} {resultCount === 1 ? "result" : "results"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendingPane({
  query,
  selected,
  onPickCategory,
  onPickScreen,
  onPickUi,
}: {
  query: string;
  selected: FilterState;
  onPickCategory: (item: string) => void;
  onPickScreen: (item: string) => void;
  onPickUi: (item: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const ops = CATALOG.filter(
    (o) =>
      !q ||
      o.name.toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q),
  ).slice(0, 10);

  const screens = MEGA.screens.filter((s) => !q || s.toLowerCase().includes(q));
  const uis = MEGA.uiElements.filter((u) => !q || u.toLowerCase().includes(q));

  return (
    <div className="space-y-7">
      {ops.length > 0 && (
        <section>
          <div className="mb-3 flex gap-2.5 overflow-x-auto pb-1">
            {ops.map((op) => (
              <button
                key={op.slug}
                type="button"
                onClick={() => onPickCategory(op.category)}
                title={op.name}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl text-[13px] font-semibold transition-colors",
                  selected.categories.includes(op.category)
                    ? "bg-white text-[#111]"
                    : "bg-white/[0.06] text-[#cfcfcf] hover:bg-white/[0.1]",
                )}
              >
                {op.name.slice(0, 1)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-[12px] font-medium text-[#636363]">Screens</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {screens.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onPickScreen(label)}
              className={cn(
                "flex flex-col overflow-hidden rounded-2xl text-left transition-colors",
                selected.screens.includes(label)
                  ? "bg-white/[0.12] ring-1 ring-white/20"
                  : "bg-white/[0.04] hover:bg-white/[0.08]",
              )}
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-white/[0.06] to-transparent">
                <Waypoints className="size-5 text-[#636363]" strokeWidth={1.6} />
              </div>
              <span className="px-2.5 py-2 text-[12px] font-medium text-[#f5f5f5]">
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[12px] font-medium text-[#636363]">UI Elements</h3>
        <div className="flex flex-wrap gap-2">
          {uis.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onPickUi(label)}
              className={cn(
                "h-8 rounded-full px-3 text-[12px] font-medium transition-colors",
                selected.uiElements.includes(label)
                  ? "bg-white text-[#111]"
                  : "bg-white/[0.06] text-[#cfcfcf] hover:bg-white/[0.1]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ListPane({
  title,
  items,
  selected,
  query,
  kind,
  onToggle,
}: {
  title: string;
  items: string[];
  selected: string[];
  query: string;
  kind: NavSection;
  onToggle: (item: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = items.filter((i) => !q || i.toLowerCase().includes(q));

  return (
    <div>
      <h3 className="mb-2 px-2 text-[12px] font-medium text-[#636363]">{title}</h3>
      <ul className="space-y-0.5">
        {filtered.map((item) => {
          const active = selected.includes(item);
          const n = countForLabel(kind, item);
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => onToggle(item)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] transition-colors",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-[#cfcfcf] hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <span className="font-medium">{item}</span>
                <span className="text-[12px] tabular-nums text-[#636363]">
                  {n.toLocaleString()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GroupedListPane({
  groups,
  selected,
  query,
  kind,
  onToggle,
}: {
  groups: { label: string; items: string[] }[];
  selected: string[];
  query: string;
  kind: NavSection;
  onToggle: (item: string) => void;
}) {
  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const items = group.items.filter(
          (i) => !q || i.toLowerCase().includes(q),
        );
        if (!items.length) return null;
        return (
          <section key={group.label}>
            <h3 className="mb-2 px-2 text-[12px] font-medium text-[#636363]">
              {group.label}
            </h3>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active = selected.includes(item);
                const n = countForLabel(kind, item);
                return (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => onToggle(item)}
                      className={cn(
                        "flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] transition-colors",
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-[#cfcfcf] hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <span className="font-medium">{item}</span>
                      <span className="text-[12px] tabular-nums text-[#636363]">
                        {n.toLocaleString()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
