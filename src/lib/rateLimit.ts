import { sql } from './db'

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first.slice(0, 64)
  }
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real.slice(0, 64)
  return 'unknown'
}

/** Returns true if under the limit and records this hit. */
export async function takeRateLimit(
  bucket: string,
  maxHits: number,
  windowMs: number,
  options?: { failOpen?: boolean },
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString()
  try {
    const counted = await sql<{ c: number }>(
      `select count(*)::int as c from rate_limits where bucket = $1 and hit_at > $2::timestamptz`,
      [bucket, since],
    )
    if ((counted[0]?.c ?? 0) >= maxHits) return false
    await sql(`insert into rate_limits (bucket) values ($1)`, [bucket])
    if (Math.random() < 0.02) {
      await sql(`delete from rate_limits where hit_at < now() - interval '2 days'`)
    }
    return true
  } catch {
    return options?.failOpen === true
  }
}
