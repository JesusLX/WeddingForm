// In-memory sliding-window rate limiter.
// Per serverless instance, so it's best-effort — enough to stop naive spam.

type Window = { count: number; resetAt: number }

const windows = new Map<string, Window>()
const MAX_ENTRIES = 10_000

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now()

  if (windows.size > MAX_ENTRIES) {
    for (const [k, w] of windows) {
      if (w.resetAt < now) windows.delete(k)
    }
  }

  const current = windows.get(key)
  if (!current || current.resetAt < now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }

  current.count += 1
  if (current.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfterSeconds: 0 }
}
