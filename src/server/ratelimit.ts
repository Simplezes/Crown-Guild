import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

const LIMITS = {
  crown: { requests: 20, window: "1 m" },
  beacon: { requests: 5, window: "1 m" },
  mission: { requests: 10, window: "1 m" },
  status: { requests: 10, window: "1 m" },
  settings: { requests: 10, window: "1 m" },
  flare: { requests: 10, window: "1 m" },
  collection: { requests: 20, window: "1 m" },
  wishlist: { requests: 20, window: "1 m" },
  notification: { requests: 20, window: "1 m" },
  account: { requests: 3, window: "1 m" },
} satisfies Record<string, { requests: number; window: Window }>;

export type LimitKey = keyof typeof LIMITS;

let redis: Redis | null | undefined;
const limiters = new Map<LimitKey, Ratelimit>();

function getRedis(): Redis | null {
  if (redis === undefined) {
    redis =
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
        : null;
  }
  return redis;
}

function getLimiter(key: LimitKey): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  let limiter = limiters.get(key);
  if (!limiter) {
    const { requests, window } = LIMITS[key];
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${key}`,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export async function checkRateLimit(key: LimitKey, userId: string): Promise<Response | null> {
  const limiter = getLimiter(key);
  if (!limiter) return null;

  const { success, limit, remaining, reset } = await limiter.limit(userId);
  if (success) return null;

  return Response.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      },
    },
  );
}
