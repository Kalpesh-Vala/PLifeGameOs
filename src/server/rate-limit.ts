import { TRPCError } from "@trpc/server";

/**
 * Simple in-memory fixed-window rate limiter. Suitable for a single Node
 * server instance (this app's deployment model). For multi-instance scale,
 * swap the store for Redis/Upstash behind the same interface.
 */
type Bucket = { count: number; resetAt: number };

declare global {
  var _rateLimitStore: Map<string, Bucket> | undefined;
}

const store: Map<string, Bucket> =
  global._rateLimitStore ?? new Map<string, Bucket>();
if (!global._rateLimitStore) global._rateLimitStore = store;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, retryAfterMs: 0 };
}

/**
 * Enforces a rate limit for a user+action, throwing TOO_MANY_REQUESTS when
 * exceeded. Use for expensive endpoints (AI calls, exports).
 */
export function enforceRateLimit(
  userId: string,
  action: string,
  max: number,
  windowMs: number,
): void {
  const result = checkRateLimit(`${action}:${userId}`, max, windowMs);
  if (!result.ok) {
    const seconds = Math.ceil(result.retryAfterMs / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many requests. Try again in ${seconds}s.`,
    });
  }
}
