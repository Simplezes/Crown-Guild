const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN = /(token|secret|password|authorization|cookie|session|auth|key)/i;

function limitString(value, max = 300) {
  const str = String(value || "");
  return str.length > max ? `${str.slice(0, max)}...` : str;
}

function sanitizeForLogs(value, depth = 0, seen = new WeakSet()) {
  if (value == null) return value;
  if (typeof value === "string") return limitString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: limitString(value.message, 500),
      stack: process.env.NODE_ENV === "production" ? undefined : limitString(value.stack || "", 1500),
    };
  }

  if (depth > 3) return "[truncated]";

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeForLogs(item, depth + 1, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) return "[circular]";
    seen.add(value);

    const output = {};
    for (const [key, raw] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = REDACTED;
      } else {
        output[key] = sanitizeForLogs(raw, depth + 1, seen);
      }
    }
    return output;
  }

  return limitString(value);
}

export function logServerError(message, error, meta) {
  const payload = {
    error: sanitizeForLogs(error),
    meta: meta ? sanitizeForLogs(meta) : undefined,
  };
  console.error(message, payload);
}
