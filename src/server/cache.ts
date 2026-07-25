/**
 * Server-side cache-aside layer.
 *
 * A lightweight in-memory TTL cache with per-user invalidation, used to avoid
 * recomputing expensive read aggregations (analytics, leaderboard, profile) on
 * every request. Reads are cached; any mutation bumps the user's "generation",
 * atomically invalidating all of that user's cached reads.
 *
 * This is an L1 cache: it helps within a warm server instance. For multi-region
 * / serverless (e.g. Vercel) production scale, swap the `store`/`generations`
 * maps for Upstash Redis behind the same interface — the call sites stay the
 * same.
 */

type Entry = { value: unknown; expiresAt: number };

type CacheStats = {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  size: number;
};

type CacheState = {
  store: Map<string, Entry>;
  generations: Map<string, number>;
  stats: Omit<CacheStats, "size">;
};

declare global {
  var _serverCache: CacheState | undefined;
}

const state: CacheState =
  global._serverCache ?? {
    store: new Map(),
    generations: new Map(),
    stats: { hits: 0, misses: 0, sets: 0, invalidations: 0 },
  };
if (!global._serverCache) global._serverCache = state;

const MAX_ENTRIES = 5000;

function prune(now: number) {
  if (state.store.size < MAX_ENTRIES) return;
  for (const [key, entry] of state.store) {
    if (entry.expiresAt <= now) state.store.delete(key);
  }
  // Hard cap: if still oversized, drop oldest insertions.
  if (state.store.size >= MAX_ENTRIES) {
    const excess = state.store.size - Math.floor(MAX_ENTRIES * 0.8);
    let i = 0;
    for (const key of state.store.keys()) {
      if (i++ >= excess) break;
      state.store.delete(key);
    }
  }
}

export function getUserGeneration(userId: string): number {
  return state.generations.get(userId) ?? 0;
}

/** Invalidates every cached read for a user (called after their mutations). */
export function bumpUserGeneration(userId: string): void {
  state.generations.set(userId, getUserGeneration(userId) + 1);
  state.stats.invalidations += 1;
}

async function getOrSet<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = state.store.get(key);
  if (hit && hit.expiresAt > now) {
    state.stats.hits += 1;
    return hit.value as T;
  }

  state.stats.misses += 1;
  const value = await fn();
  state.store.set(key, { value, expiresAt: now + ttlMs });
  state.stats.sets += 1;
  prune(now);
  return value;
}

/**
 * Caches a per-user read. The user's generation is folded into the key, so a
 * `bumpUserGeneration` after any mutation makes the next read a miss.
 */
export function cachedForUser<T>(
  userId: string,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const gen = getUserGeneration(userId);
  return getOrSet(`u:${userId}:g:${gen}:${key}`, ttlMs, fn);
}

/** Caches global (non-user) data. */
export function cachedGlobal<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  return getOrSet(`g:${key}`, ttlMs, fn);
}

export function getCacheStats(): CacheStats & { hitRatio: number } {
  const { hits, misses } = state.stats;
  const total = hits + misses;
  return {
    ...state.stats,
    size: state.store.size,
    hitRatio: total === 0 ? 0 : Math.round((hits / total) * 100) / 100,
  };
}

export function resetCacheStats(): void {
  state.stats = { hits: 0, misses: 0, sets: 0, invalidations: 0 };
}
