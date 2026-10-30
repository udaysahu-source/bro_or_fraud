import rawContent from "@/content/game-modes.json";
import { GameHubContent, GameMode, AnyGameItem, ContentLevel } from "./types";

export const CONTENT = rawContent as unknown as GameHubContent;

export function getAllGameModes(): GameMode[] {
  return CONTENT.gameModes;
}

export function getGameMode(id: string): GameMode | undefined {
  return CONTENT.gameModes.find((g) => g.id === id);
}

export function getLocalizedText(
  val: any,
  lang: "hinglish" | "en" = "hinglish",
  fallback = ""
): string {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  return val[lang] || val.hinglish || val.en || fallback;
}

export interface GetContentOptions {
  language?: "hinglish" | "en";
  levels?: ContentLevel[];
  spiceLevel?: ContentLevel;
  packIds?: string[];
  packId?: string;
  tags?: string[];
  resetSeen?: boolean;
}

const SEEN_STORAGE_PREFIX = "bof_seen_items_v1_";

function getSeenIds(gameId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_PREFIX + gameId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(gameId: string, seen: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_STORAGE_PREFIX + gameId, JSON.stringify(Array.from(seen)));
  } catch {
    /* ignore storage errors */
  }
}

export function clearSeenItems(gameId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SEEN_STORAGE_PREFIX + gameId);
  } catch {
    /* ignore */
  }
}

/**
 * Returns filtered items and manages a persistent shuffle-bag so items don't
 * repeat until the active filtered pool is completely exhausted.
 */
export function getContent<T = AnyGameItem>(gameId: string, options: GetContentOptions = {}) {
  const game = getGameMode(gameId);
  if (!game) {
    return {
      pool: [] as T[],
      draw: () => null as T | null,
      remainingInBag: 0,
      totalInPool: 0,
    };
  }

  const effectivePackIds = options.packIds ?? (options.packId ? [options.packId] : undefined);
  const effectiveLevels = options.levels ?? (options.spiceLevel ? [options.spiceLevel] : undefined);

  // 1. Gather filtered items
  let pool: T[] = [];
  const collectItems = (filterByLevels = true) => {
    const items: T[] = [];
    for (const pack of game.contentPacks) {
      if (effectivePackIds && effectivePackIds.length > 0 && !effectivePackIds.includes(pack.id)) {
        continue;
      }
      for (const item of pack.items as unknown as (AnyGameItem & {
        level: ContentLevel;
        tags?: string[];
      })[]) {
        if (
          filterByLevels &&
          effectiveLevels &&
          effectiveLevels.length > 0 &&
          !effectiveLevels.includes(item.level)
        ) {
          continue;
        }
        if (
          options.tags &&
          options.tags.length > 0 &&
          !options.tags.some((t) => item.tags?.includes(t))
        ) {
          continue;
        }
        items.push(item as unknown as T);
      }
    }
    return items;
  };

  pool = collectItems(true);
  // Graceful fallback: If filtered level yields 0 items (e.g. game mode only has "spicy" items),
  // fallback to all available items in the packs so the mode never launches with an empty pool.
  if (pool.length === 0 && effectiveLevels && effectiveLevels.length > 0) {
    pool = collectItems(false);
  }

  if (options.resetSeen) {
    clearSeenItems(gameId);
  }

  const seenIds = getSeenIds(gameId);
  const poolIds = new Set(pool.map((it: any) => it.id));

  // Determine unseen items in this pool
  let unseen = pool.filter((it: any) => !seenIds.has(it.id));

  // If pool is exhausted, reset seen records for this pool and recycle
  let exhausted = false;
  if (unseen.length === 0 && pool.length > 0) {
    exhausted = true;
    for (const pid of poolIds) {
      seenIds.delete(pid);
    }
    saveSeenIds(gameId, seenIds);
    unseen = [...pool];
  }

  // Shuffle unseen array (Fisher-Yates)
  for (let i = unseen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
  }

  const draw = (): T | null => {
    if (unseen.length === 0) {
      // Recycle again if drawing continuously
      for (const pid of poolIds) {
        seenIds.delete(pid);
      }
      saveSeenIds(gameId, seenIds);
      unseen = [...pool];
      for (let i = unseen.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unseen[i], unseen[j]] = [unseen[j], unseen[i]];
      }
    }

    const item = unseen.pop() || null;
    if (item) {
      seenIds.add((item as any).id);
      saveSeenIds(gameId, seenIds);
    }
    return item;
  };

  return {
    pool,
    draw,
    remainingInBag: unseen.length,
    totalInPool: pool.length,
    exhausted,
  };
}

export function getContentItem<T = AnyGameItem>(
  gameId: string,
  options: GetContentOptions = {}
): T | null {
  const bag = getContent<T>(gameId, options);
  return bag.draw();
}

