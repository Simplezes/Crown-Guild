import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis;
let ratelimiters = {};

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * @param {"crown" | "beacon" | "mission" | "status"} key
 * @returns {Ratelimit | null}
 */
function getLimiter(key) {
  const r = getRedis();
  if (!r) return null;

  if (!ratelimiters[key]) {
    const limits = {
      crown:   { requests: 20, window: "1 m" },
      beacon:  { requests: 5,  window: "1 m" },
      mission: { requests: 10, window: "1 m" },
      status:  { requests: 10, window: "1 m" },
    };
    const { requests, window } = limits[key];
    ratelimiters[key] = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${key}`,
    });
  }

  return ratelimiters[key];
}

/**
 * Check rate limit for a user. Returns a 429 Response if exceeded, null if allowed.
 * Silently passes through if Upstash env vars are not configured.
 * @param {"crown" | "beacon" | "mission" | "status"} key
 * @param {string} userId
 * @returns {Promise<Response | null>}
 */
export async function checkRateLimit(key, userId) {
  const limiter = getLimiter(key);
  if (!limiter) return null;

  const { success, limit, remaining, reset } = await limiter.limit(userId);

  if (!success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  return null;
}
