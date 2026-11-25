import { sql } from './db'

/**
 * Resolve client IP for rate limiting.
 * Prefer platform-set headers; for X-Forwarded-For use the rightmost hop
 * (appended by the trusted proxy). The leftmost value is client-controlled
 * and must not be trusted for throttling.
 */
export function clientIp(request: Request): string {
  const vercel = request.headers.get('x-vercel-forwarded-for')?.trim()
  if (vercel) {
    const last = vercel.split(',').map((s) => s.trim()).filter(Boolean).at(-1)
    if (last) return last.slice(0, 64)
  }

  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 64)

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const last = forwarded.split(',').map((s) => s.trim()).filter(Boolean).at(-1)
    if (last) return last.slice(0, 64)
  }

  return 'unknown'
}

/** Returns true if under the limit and records this hit. Fails closed on DB errors. */
export async function takeRateLimit(
  bucket: string,
  maxHits: number,
  windowMs: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString()
  try {
    // Always prune this bucket's expired rows so the table cannot grow without bound.
    await sql(`delete from rate_limits where bucket = $1 and hit_at <= $2::timestamptz`, [
      bucket,
      since,
    ])
    const counted = await sql<{ c: number }>(
      `select count(*)::int as c from rate_limits where bucket = $1 and hit_at > $2::timestamptz`,
      [bucket, since],
    )
    if ((counted[0]?.c ?? 0) >= maxHits) return false
    await sql(`insert into rate_limits (bucket) values ($1)`, [bucket])
    // Occasional global sweep for abandoned buckets.
    if (Math.random() < 0.1) {
      await sql(`delete from rate_limits where hit_at < now() - interval '1 day'`)
    }
    return true
  } catch {
    return false
  }
}
