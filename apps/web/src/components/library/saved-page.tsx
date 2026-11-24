"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { Bookmark, FolderPlus, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/library/site-header";
import { PreviewCard } from "@/components/library/preview-card";
import { LibrarySkeleton } from "@/components/brand/blaast-preloader";
import type { CatalogOperator } from "@/lib/library/catalog";
import {
  createCollection,
  deleteCollection,
  migrateLegacySaved,
  readCollectionsState,
  subscribeCollections,
  type CollectionsState,
} from "@/lib/library/collections-store";
import { cn } from "@/lib/utils";

export function SavedPage() {
  const [catalog, setCatalog] = useState<CatalogOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<CollectionsState>({
    favorites: [],
    collections: [],
  });
  const [activeId, setActiveId] = useState<string>("favorites");
  const [newName, setNewName] = useState("");

  const refresh = useCallback(() => {
    setState(readCollectionsState());
  }, []);

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
          refresh();
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
  }, [refresh]);

  useEffect(() => subscribeCollections(refresh), [refresh]);

  const bySlug = useMemo(() => {
    const map = new Map<string, CatalogOperator>();
    for (const o of catalog) map.set(o.slug, o);
    return map;
  }, [catalog]);

  const activeItems = useMemo(() => {
    if (activeId === "favorites") return state.favorites;
    const col = state.collections.find((c) => c.id === activeId);
    return col?.items ?? [];
  }, [activeId, state]);

  const operators = useMemo(() => {
    return activeItems
      .map((item) => {
        const op = bySlug.get(item.slug);
        if (!op) return null;
        return { op, focusChip: item.focusChip ?? null };
      })
      .filter(Boolean) as { op: CatalogOperator; focusChip: string | null }[];
  }, [activeItems, bySlug]);

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    const col = createCollection(newName);
    if (!col) return;
    setNewName("");
    setActiveId(col.id);
  };

  return (
    <div className="lib-surface min-h-screen">
      <div className="lib-chrome lib-hairline sticky top-0 z-[100] h-14 border-b">
        <SiteHeader
          tab="library"
          searchPlaceholder="Search saved…"
          onSearchOpen={() => undefined}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-5 py-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <p className="mb-3 text-[12px] font-medium text-[#636363]">
            Collections
          </p>
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => setActiveId("favorites")}
                className={cn(
                  "flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-[13px] font-medium transition-colors",
                  activeId === "favorites"
                    ? "bg-white/[0.08] text-white"
                    : "text-[#cfcfcf] hover:bg-white/[0.04]",
                )}
              >
                <Bookmark className="size-3.5" strokeWidth={1.75} />
                Favourites
                <span className="ml-auto tabular-nums text-[#636363]">
                  {state.favorites.length}
                </span>
              </button>
            </li>
            {state.collections.map((col) => (
              <li key={col.id} className="group/col flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveId(col.id)}
                  className={cn(
                    "flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-left text-[13px] font-medium transition-colors",
                    activeId === col.id
                      ? "bg-white/[0.08] text-white"
                      : "text-[#cfcfcf] hover:bg-white/[0.04]",
                  )}
                >
                  <span className="size-3.5 shrink-0 rounded-[3px] border border-current opacity-60" />
                  <span className="truncate">{col.name}</span>
                  <span className="ml-auto tabular-nums text-[#636363]">
                    {col.items.length}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${col.name}`}
                  onClick={() => {
                    deleteCollection(col.id);
                    if (activeId === col.id) setActiveId("favorites");
                  }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#636363] opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-white group-hover/col:opacity-100"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={onCreate} className="mt-4 space-y-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection"
              maxLength={64}
              className="h-9 w-full rounded-xl border-0 bg-white/[0.06] px-3 text-[12px] text-white outline-none placeholder:text-[#636363] focus:ring-1 focus:ring-white/20"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.08] text-[12px] font-medium text-[#cfcfcf] transition-colors hover:bg-white/[0.12] hover:text-white disabled:opacity-40"
            >
              <FolderPlus className="size-3.5" strokeWidth={1.75} />
              Create
            </button>
          </form>
          <Link
            href="/library"
            className="mt-6 inline-block text-[12px] text-[#8a8a8a] hover:text-white"
          >
            ← Back to library
          </Link>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {activeId === "favorites"
                  ? "Favourites"
                  : state.collections.find((c) => c.id === activeId)?.name ??
                    "Saved"}
              </h1>
              <p className="mt-1 text-[13px] text-[#8a8a8a]">
                Private on this device — hover any library tile to bookmark.
              </p>
            </div>
            {/* Mobile collection picker */}
            <select
              className="h-9 rounded-xl border-0 bg-white/[0.06] px-3 text-[12px] text-white md:hidden"
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
            >
              <option value="favorites">
                Favourites ({state.favorites.length})
              </option>
              {state.collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.items.length})
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LibrarySkeleton className="!min-h-0 px-0 pt-2" />
          ) : operators.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/[0.1] px-6 py-16 text-center">
              <Bookmark
                className="mx-auto size-8 text-[#636363]"
                strokeWidth={1.5}
              />
              <p className="mt-4 text-[15px] font-medium text-white">
                Nothing saved here yet
              </p>
              <p className="mt-1 text-[13px] text-[#8a8a8a]">
                Hover a brand tile in the library and tap the bookmark.
              </p>
              <Link
                href="/library"
                className="mt-6 inline-flex h-10 items-center rounded-full bg-white px-5 text-[13px] font-semibold text-[#111]"
              >
                Browse library
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {operators.map(({ op, focusChip }) => (
                <PreviewCard
                  key={`${activeId}-${op.slug}-${focusChip ?? ""}`}
                  operator={op}
                  focusChip={focusChip}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
