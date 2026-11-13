import "server-only";

const REDACTED = "[redacted]";
const SENSITIVE_KEY = /(token|secret|password|authorization|cookie|session|auth|key)/i;

function clip(value: unknown, max = 300): string {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function sanitize(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value == null) return value;
  if (typeof value === "string") return clip(value);
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: clip(value.message, 500),
      stack: process.env.NODE_ENV === "production" ? undefined : clip(value.stack, 1500),
    };
  }

  if (depth > 3) return "[truncated]";
  if (Array.isArray(value))
    return value.slice(0, 20).map((item) => sanitize(item, depth + 1, seen));

  if (typeof value === "object") {
    if (seen.has(value)) return "[circular]";
    seen.add(value);
    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      output[key] = SENSITIVE_KEY.test(key) ? REDACTED : sanitize(raw, depth + 1, seen);
    }
    return output;
  }

  return clip(value);
}

export function logServerError(message: string, error: unknown, meta?: unknown): void {
  console.error(message, {
    error: sanitize(error),
    meta: meta ? sanitize(meta) : undefined,
  });
}
