const attempts = new Map<string, { count: number; reset: number }>();
let operations = 0;

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

export function checkRateLimit(key: string, limit = 8, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  operations += 1;
  if (operations % 250 === 0) {
    for (const [entryKey, entry] of attempts) if (entry.reset <= now) attempts.delete(entryKey);
  }
  const current = attempts.get(key);
  if (!current || current.reset <= now) {
    const resetAt = now + windowMs;
    attempts.set(key, { count: 1, reset: resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetAt: current.reset };
  current.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - current.count), resetAt: current.reset };
}

export function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  return checkRateLimit(key, limit, windowMs).allowed;
}
