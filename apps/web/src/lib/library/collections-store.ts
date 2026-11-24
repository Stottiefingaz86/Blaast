/**
 * Private-by-default favourites + named collections (client localStorage).
 * Syncs across tiles / header via a window event — no cloud yet.
 */

export type CollectionItem = {
  slug: string;
  addedAt: string;
  /** Optional library focus chip when saved from a filtered tile */
  focusChip?: string | null;
};

export type Collection = {
  id: string;
  name: string;
  createdAt: string;
  items: CollectionItem[];
};

export type CollectionsState = {
  favorites: CollectionItem[];
  collections: Collection[];
};

const STORAGE_KEY = "blaast:collections-v1";
const LEGACY_SAVED = (slug: string) => `blaast:operator-saved:${slug}`;
export const COLLECTIONS_EVENT = "blaast:collections-changed";

const EMPTY: CollectionsState = { favorites: [], collections: [] };

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COLLECTIONS_EVENT));
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `col_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readCollectionsState(): CollectionsState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CollectionsState;
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      collections: Array.isArray(parsed.collections) ? parsed.collections : [],
    };
  } catch {
    return EMPTY;
  }
}

export function writeCollectionsState(state: CollectionsState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
  emit();
}

/** Pull legacy single-operator saves into Favourites once. */
export function migrateLegacySaved(knownSlugs: string[]) {
  if (typeof window === "undefined" || !knownSlugs.length) return;
  const state = readCollectionsState();
  let changed = false;
  for (const slug of knownSlugs) {
    try {
      if (localStorage.getItem(LEGACY_SAVED(slug)) !== "1") continue;
      if (!state.favorites.some((f) => f.slug === slug)) {
        state.favorites.push({ slug, addedAt: nowIso() });
        changed = true;
      }
      localStorage.removeItem(LEGACY_SAVED(slug));
    } catch {
      /* ignore */
    }
  }
  if (changed) writeCollectionsState(state);
}

export function isFavorite(slug: string, state = readCollectionsState()) {
  return state.favorites.some((f) => f.slug === slug);
}

export function isBookmarked(slug: string, state = readCollectionsState()) {
  if (isFavorite(slug, state)) return true;
  return state.collections.some((c) => c.items.some((i) => i.slug === slug));
}

export function toggleFavorite(
  slug: string,
  focusChip?: string | null,
): boolean {
  const state = readCollectionsState();
  const idx = state.favorites.findIndex((f) => f.slug === slug);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
    writeCollectionsState(state);
    try {
      localStorage.removeItem(LEGACY_SAVED(slug));
    } catch {
      /* ignore */
    }
    return false;
  }
  state.favorites.unshift({
    slug,
    addedAt: nowIso(),
    focusChip: focusChip ?? null,
  });
  writeCollectionsState(state);
  try {
    localStorage.setItem(LEGACY_SAVED(slug), "1");
  } catch {
    /* ignore */
  }
  return true;
}

export function createCollection(name: string): Collection | null {
  const trimmed = name.trim().slice(0, 64);
  if (!trimmed) return null;
  const state = readCollectionsState();
  const col: Collection = {
    id: newId(),
    name: trimmed,
    createdAt: nowIso(),
    items: [],
  };
  state.collections.unshift(col);
  writeCollectionsState(state);
  return col;
}

export function renameCollection(id: string, name: string) {
  const trimmed = name.trim().slice(0, 64);
  if (!trimmed) return;
  const state = readCollectionsState();
  const col = state.collections.find((c) => c.id === id);
  if (!col) return;
  col.name = trimmed;
  writeCollectionsState(state);
}

export function deleteCollection(id: string) {
  const state = readCollectionsState();
  state.collections = state.collections.filter((c) => c.id !== id);
  writeCollectionsState(state);
}

export function isInCollection(
  collectionId: string,
  slug: string,
  state = readCollectionsState(),
) {
  const col = state.collections.find((c) => c.id === collectionId);
  return Boolean(col?.items.some((i) => i.slug === slug));
}

export function toggleInCollection(
  collectionId: string,
  slug: string,
  focusChip?: string | null,
): boolean {
  const state = readCollectionsState();
  const col = state.collections.find((c) => c.id === collectionId);
  if (!col) return false;
  const idx = col.items.findIndex((i) => i.slug === slug);
  if (idx >= 0) {
    col.items.splice(idx, 1);
    writeCollectionsState(state);
    return false;
  }
  col.items.unshift({
    slug,
    addedAt: nowIso(),
    focusChip: focusChip ?? null,
  });
  writeCollectionsState(state);
  return true;
}

export function removeSlugEverywhere(slug: string) {
  const state = readCollectionsState();
  state.favorites = state.favorites.filter((f) => f.slug !== slug);
  for (const col of state.collections) {
    col.items = col.items.filter((i) => i.slug !== slug);
  }
  writeCollectionsState(state);
  try {
    localStorage.removeItem(LEGACY_SAVED(slug));
  } catch {
    /* ignore */
  }
}

export function subscribeCollections(cb: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) cb();
  };
  window.addEventListener(COLLECTIONS_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(COLLECTIONS_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}
