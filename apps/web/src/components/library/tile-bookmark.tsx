"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Bookmark, Check, Plus } from "lucide-react";
import {
  createCollection,
  isBookmarked,
  isFavorite,
  isInCollection,
  readCollectionsState,
  subscribeCollections,
  toggleFavorite,
  toggleInCollection,
  type CollectionsState,
} from "@/lib/library/collections-store";
import { cn } from "@/lib/utils";

/**
 * Hover bookmark on library tiles — favourites + named collections.
 * Stops navigation when interacting (parent is often a Link).
 */
export function TileBookmark({
  slug,
  focusChip,
  className,
  alwaysVisible,
}: {
  slug: string;
  focusChip?: string | null;
  className?: string;
  /** Keep icon visible when already saved (not only on hover) */
  alwaysVisible?: boolean;
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CollectionsState>({
    favorites: [],
    collections: [],
  });
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(() => {
    setState(readCollectionsState());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeCollections(refresh);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      const t = e.target as Node | null;
      if (rootRef.current && t && !rootRef.current.contains(t)) {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const saved = isBookmarked(slug, state);
  const fav = isFavorite(slug, state);
  const show = alwaysVisible || saved || open;

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onToggleOpen = (e: MouseEvent) => {
    stop(e);
    setOpen((v) => !v);
  };

  const onFavorite = (e: MouseEvent) => {
    stop(e);
    toggleFavorite(slug, focusChip);
  };

  const onCollection = (e: MouseEvent, collectionId: string) => {
    stop(e);
    toggleInCollection(collectionId, slug, focusChip);
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const col = createCollection(newName);
    if (!col) return;
    toggleInCollection(col.id, slug, focusChip);
    setNewName("");
    setCreating(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "absolute top-3 right-3 z-20",
        className,
        show
          ? "opacity-100"
          : "opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
        "transition-opacity duration-150",
      )}
    >
      <button
        type="button"
        aria-label={saved ? "Saved — manage collections" : "Save to collection"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggleOpen}
        className={cn(
          "flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors",
          saved || open
            ? "border-white/25 bg-white text-[#111]"
            : "border-white/15 bg-black/55 text-white hover:bg-black/70",
        )}
      >
        <Bookmark
          className="size-4"
          strokeWidth={1.75}
          fill={saved ? "currentColor" : "none"}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Save to collection"
          className="absolute top-11 right-0 w-[240px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#1c1c1c] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)]"
          onClick={stop}
        >
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="text-[11px] font-medium tracking-wide text-[#8a8a8a]">
              Save to
            </p>
          </div>
          <ul className="max-h-[220px] overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={onFavorite}
                className="flex h-10 w-full items-center gap-2.5 px-3 text-left text-[13px] text-[#f0f0f0] hover:bg-white/[0.06]"
              >
                <Bookmark
                  className="size-3.5 shrink-0"
                  strokeWidth={1.75}
                  fill={fav ? "currentColor" : "none"}
                />
                <span className="flex-1 font-medium">Favourites</span>
                {fav ? (
                  <Check className="size-3.5 text-white" strokeWidth={2} />
                ) : null}
              </button>
            </li>
            {state.collections.map((col) => {
              const inCol = isInCollection(col.id, slug, state);
              return (
                <li key={col.id}>
                  <button
                    type="button"
                    onClick={(e) => onCollection(e, col.id)}
                    className="flex h-10 w-full items-center gap-2.5 px-3 text-left text-[13px] text-[#f0f0f0] hover:bg-white/[0.06]"
                  >
                    <span className="flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border border-current opacity-70" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {col.name}
                    </span>
                    {inCol ? (
                      <Check className="size-3.5 text-white" strokeWidth={2} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-white/[0.06] p-2">
            {creating ? (
              <form onSubmit={onCreate} className="flex gap-1.5">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Collection name"
                  maxLength={64}
                  className="h-9 min-w-0 flex-1 rounded-xl border-0 bg-white/[0.06] px-2.5 text-[12px] text-white outline-none placeholder:text-[#636363] focus:ring-1 focus:ring-white/20"
                  onClick={stop}
                />
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="h-9 shrink-0 rounded-xl bg-white px-2.5 text-[12px] font-semibold text-[#111] disabled:opacity-40"
                >
                  Add
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  setCreating(true);
                }}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[12px] font-medium text-[#cfcfcf] hover:bg-white/[0.06] hover:text-white"
              >
                <Plus className="size-3.5" strokeWidth={2} />
                New collection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
