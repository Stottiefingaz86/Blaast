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
} from "lucide-react";
import type { CatalogOperator } from "@/lib/library/catalog";
import { flowMatchesJourneyFilter } from "@/lib/library/journeys";
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

/** Flows filters — player path order */
const FLOW_GROUPS: { label: string; items: string[] }[] = [
  {
    label: "Home & onboarding",
    items: ["Home", "Onboarding"],
  },
  {
    label: "Cashier",
    items: ["First time deposit", "Withdrawal"],
  },
  {
    label: "Product",
    items: ["Play casino", "Bingo Lobby", "Sports Betslip"],
  },
  {
    label: "Rewards & account",
    items: ["Loyalty & Rewards", "Support", "My Account"],
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

function matchesCategory(o: CatalogOperator, label: string) {
  const needle = label.toLowerCase();
  if (needle === "sportsbook") {
    return (
      o.kind === "sportsbook" ||
      o.category.toLowerCase().includes("sport")
    );
  }
  if (needle === "rewards & vip") {
    return (
      o.category.toLowerCase().includes("reward") ||
      o.category.toLowerCase().includes("vip")
    );
  }
  return (
    o.category.toLowerCase().includes(needle) ||
    o.kind.toLowerCase().includes(needle)
  );
}

function countForLabel(
  operators: CatalogOperator[],
  kind: NavSection,
  label: string,
) {
  if (kind === "categories") {
    return operators.filter((o) => matchesCategory(o, label)).length;
  }
  if (kind === "screens") {
    const needle = label.toLowerCase();
    return operators.reduce(
      (n, o) =>
        n +
        o.screens.filter((s) => s.title.toLowerCase().includes(needle)).length,
      0,
    );
  }
  if (kind === "uiElements") {
    const needle = label.toLowerCase();
    return operators.reduce((n, o) => {
      const hits = o.uiElements.filter((u) =>
        u.name.toLowerCase().includes(needle),
      );
      return (
        n +
        (hits.length
          ? hits.reduce((s, u) => s + (u.count ?? 1), 0)
          : 0)
      );
    }, 0);
  }
  if (kind === "flows") {
    return operators.reduce(
      (n, o) =>
        n + o.flows.filter((f) => flowMatchesJourneyFilter(f, label)).length,
      0,
    );
  }
  return 0;
}

function screenPoster(
  operators: CatalogOperator[],
  label: string,
): string | undefined {
  const needle = label.toLowerCase();
  for (const o of operators) {
    const hit = o.screens.find((s) => s.title.toLowerCase().includes(needle));
    if (hit?.posterUrl) return hit.posterUrl;
  }
  return undefined;
}

/**
 * Mobbin browse modal — search · platform icons · sidebar · content pane.
 * Trending / counts use live published operators only.
 */
export function FilterPanel({
  open,
  onOpenChange,
  value,
  onApply,
  onPickBrand,
  operators = [],
  resultCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FilterState;
  onApply: (next: FilterState) => void;
  onPickBrand?: (name: string) => void;
  operators?: CatalogOperator[];
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

  const liveCategories = useMemo(
    () =>
      MEGA.categories.filter(
        (c) => countForLabel(operators, "categories", c) > 0,
      ),
    [operators],
  );

  const liveUi = useMemo(() => {
    const fromMega = MEGA.uiElements.filter(
      (u) => countForLabel(operators, "uiElements", u) > 0,
    );
    return fromMega;
  }, [operators]);

  const liveScreenGroups = useMemo(
    () =>
      SCREEN_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => countForLabel(operators, "screens", i) > 0,
        ),
      })).filter((g) => g.items.length > 0),
    [operators],
  );

  const liveFlowGroups = useMemo(
    () =>
      FLOW_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => countForLabel(operators, "flows", i) > 0,
        ),
      })).filter((g) => g.items.length > 0),
    [operators],
  );

  if (!open) return null;

  const count = selectedCount(draft);
  const platformLabel =
    draft.platform === "mobile"
      ? "Mobile"
      : draft.platform === "web"
        ? "Desktop"
        : null;

  const pickTaxonomy = (
    key: "categories" | "screens" | "uiElements" | "flows",
    item: string,
  ) => {
    setDraft((d) => ({ ...d, [key]: toggleIn(d[key], item) }));
  };

  const applyAndClose = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close filters"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-[min(92vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#1a1a1a] shadow-2xl sm:rounded-3xl"
      >
        <h2 id={titleId} className="sr-only">
          Library filters
        </h2>

        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 py-3 sm:px-4">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#636363]"
              strokeWidth={1.75}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search library..."
              className="h-10 w-full rounded-xl border-0 bg-white/[0.06] pl-9 pr-3 text-[13px] text-white outline-none placeholder:text-[#636363] focus:ring-1 focus:ring-white/20"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(
              [
                { id: "mobile" as const, icon: Smartphone, label: "Mobile" },
                { id: "web" as const, icon: Monitor, label: "Desktop" },
                { id: "any" as const, icon: Flame, label: "Any" },
              ] as const
            ).map(({ id, icon: Icon, label }) => {
              const active = draft.platform === id;
              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      platform: id,
                    }))
                  }
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-white text-[#111]"
                      : "text-[#8a8a8a] hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[148px] shrink-0 flex-col gap-0.5 border-r border-white/[0.06] px-2 py-3 sm:w-[168px]">
            {platformLabel && (
              <div className="mb-1.5 flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-2.5 py-2">
                <span className="text-[12px] font-medium text-white">
                  {platformLabel}
                </span>
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

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {section === "trending" && (
              <TrendingPane
                query={query}
                selected={draft}
                operators={operators}
                onPickBrand={(name) => {
                  onPickBrand?.(name);
                  onOpenChange(false);
                }}
                onPickScreen={(item) => pickTaxonomy("screens", item)}
                onPickUi={(item) => pickTaxonomy("uiElements", item)}
              />
            )}
            {section === "categories" && (
              <ListPane
                title="Categories"
                items={liveCategories}
                selected={draft.categories}
                query={query}
                kind="categories"
                operators={operators}
                onToggle={(item) => pickTaxonomy("categories", item)}
              />
            )}
            {section === "screens" && (
              <GroupedListPane
                groups={liveScreenGroups}
                selected={draft.screens}
                query={query}
                kind="screens"
                operators={operators}
                onToggle={(item) => pickTaxonomy("screens", item)}
              />
            )}
            {section === "uiElements" && (
              <ListPane
                title="UI Elements"
                items={liveUi}
                selected={draft.uiElements}
                query={query}
                kind="uiElements"
                operators={operators}
                onToggle={(item) => pickTaxonomy("uiElements", item)}
              />
            )}
            {section === "flows" && (
              <GroupedListPane
                groups={liveFlowGroups}
                selected={draft.flows}
                query={query}
                kind="flows"
                operators={operators}
                onToggle={(item) => pickTaxonomy("flows", item)}
              />
            )}
          </div>
        </div>

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
  operators,
  onPickBrand,
  onPickScreen,
  onPickUi,
}: {
  query: string;
  selected: FilterState;
  operators: CatalogOperator[];
  onPickBrand: (name: string) => void;
  onPickScreen: (item: string) => void;
  onPickUi: (item: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const ops = operators
    .filter(
      (o) =>
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q),
    )
    .slice(0, 12);

  // Curated MEGA screens only (Mobbin-style) — never dump raw capture titles
  const screenLabels = useMemo(
    () =>
      MEGA.screens
        .filter(
          (s) =>
            countForLabel(operators, "screens", s) > 0 &&
            (!q || s.toLowerCase().includes(q)),
        )
        .slice(0, 6),
    [operators, q],
  );

  const uis = MEGA.uiElements
    .filter(
      (u) =>
        countForLabel(operators, "uiElements", u) > 0 &&
        (!q || u.toLowerCase().includes(q)),
    )
    .slice(0, 6);

  return (
    <div className="space-y-7">
      {ops.length > 0 && (
        <section>
          <div className="mb-3 flex gap-2.5 overflow-x-auto pb-1">
            {ops.map((op) => (
              <button
                key={op.slug}
                type="button"
                onClick={() => onPickBrand(op.name)}
                title={op.name}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-[13px] font-semibold transition-colors",
                  "bg-white/[0.06] text-[#cfcfcf] hover:bg-white/[0.1]",
                )}
              >
                {op.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={op.logoUrl}
                    alt=""
                    className="size-full object-contain p-1.5"
                  />
                ) : (
                  op.name.slice(0, 1)
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-[12px] font-medium text-[#636363]">Screens</h3>
        {screenLabels.length === 0 ? (
          <p className="text-[13px] text-[#636363]">
            No published screens yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {screenLabels.map((label) => {
              const poster = screenPoster(operators, label);
              return (
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
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-white/[0.06] to-transparent">
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={poster}
                        alt=""
                        className="absolute inset-0 size-full object-cover object-top"
                      />
                    ) : null}
                  </div>
                  <span className="px-2.5 py-2 text-[12px] font-medium text-[#f5f5f5]">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {uis.length > 0 && (
        <section>
          <h3 className="mb-3 text-[12px] font-medium text-[#636363]">
            UI Elements
          </h3>
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
      )}
    </div>
  );
}

function ListPane({
  title,
  items,
  selected,
  query,
  kind,
  operators,
  onToggle,
}: {
  title: string;
  items: string[];
  selected: string[];
  query: string;
  kind: NavSection;
  operators: CatalogOperator[];
  onToggle: (item: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = items.filter((i) => !q || i.toLowerCase().includes(q));

  if (!filtered.length) {
    return (
      <p className="px-2 text-[13px] text-[#636363]">
        Nothing published for {title.toLowerCase()} yet.
      </p>
    );
  }

  return (
    <div>
      <h3 className="mb-2 px-2 text-[12px] font-medium text-[#636363]">{title}</h3>
      <ul className="space-y-0.5">
        {filtered.map((item) => {
          const active = selected.includes(item);
          const n = countForLabel(operators, kind, item);
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
  operators,
  onToggle,
}: {
  groups: { label: string; items: string[] }[];
  selected: string[];
  query: string;
  kind: NavSection;
  operators: CatalogOperator[];
  onToggle: (item: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((i) => !q || i.toLowerCase().includes(q)),
    }))
    .filter((g) => g.items.length > 0);

  if (!visible.length) {
    return (
      <p className="px-2 text-[13px] text-[#636363]">
        Nothing published here yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {visible.map((group) => (
        <section key={group.label}>
          <h3 className="mb-2 px-2 text-[12px] font-medium text-[#636363]">
            {group.label}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = selected.includes(item);
              const n = countForLabel(operators, kind, item);
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
      ))}
    </div>
  );
}
