/**
 * App-level Rate Limiter for critical actions (e.g. Load Board post/bid)
 * - Primary: Upstash Redis (@upstash/ratelimit) when UPSTASH_* configured
 * - Fallback: In-memory sliding window (single instance / dev). For prod always configure Upstash.
 * - Also compatible with mobile via REST (Upstash works cross platform)
 *
 * Lightweight one-man: no Supabase Edge fn required unless you prefer it.
 * Usage in hooks:
 *   const ok = await checkRateLimit(`loadboard:post:${companyId}`, 5, '1m');
 *   if (!ok) return { error: new Error('Rate limit exceeded. Try again soon.') };
 */

import { captureException } from './errorLogger';

type RateResult = { success: boolean; remaining: number; reset?: number };

let upstashRatelimit: any = null;

function getUpstashLimiter() {
  if (upstashRatelimit) return upstashRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // Dynamic requires so app doesn't crash if package not installed yet
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Ratelimit } = require('@upstash/ratelimit');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis');
    const redis = new Redis({ url, token });
    // 5 requests per minute per key is sane for load board (tune in prod)
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: false,
    });
    return upstashRatelimit;
  } catch (e) {
    captureException(e, { feature: 'rate-limiter', action: 'init' });
    return null;
  }
}

// Simple in-memory fallback (per tab/process, not distributed)
const memoryBuckets = new Map<string, number[]>();

function memoryCheck(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now();
  let arr = memoryBuckets.get(key) || [];
  arr = arr.filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    return { success: false, remaining: 0, reset: arr[0] + windowMs };
  }
  arr.push(now);
  memoryBuckets.set(key, arr);
  return { success: true, remaining: Math.max(0, max - arr.length) };
}

export async function checkRateLimit(
  key: string,
  maxPerWindow = 5,
  window: '1 m' | '5 m' | '1 h' = '1 m'
): Promise<RateResult> {
  const limiter = getUpstashLimiter();
  const windowMs =
    window === '1 m' ? 60_000 : window === '5 m' ? 5 * 60_000 : 60 * 60_000;

  if (!limiter) {
    // Fallback (works immediately, upgrade by setting Upstash env)
    return memoryCheck(key, maxPerWindow, windowMs);
  }

  try {
    const res = await limiter.limit(key);
    return {
      success: res.success,
      remaining: res.remaining ?? 0,
      reset: res.reset,
    };
  } catch (e) {
    captureException(e, { feature: 'rate-limiter', key });
    // Fail open (don't block users if redis down) + memory fallback
    return memoryCheck(key, maxPerWindow, windowMs);
  }
}

// Helper for load board specific
export const LOADBOARD_POST_LIMIT = { max: 5, window: '1 m' as const };
export const LOADBOARD_BID_LIMIT = { max: 8, window: '1 m' as const };
