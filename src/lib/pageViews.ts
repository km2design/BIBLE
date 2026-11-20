import { dateKey } from '../data/dailyStories'
import { sql } from './db'
import { clientIp, takeRateLimit } from './rateLimit'

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/** Record one public daily-story view (at most once per IP per date per hour). */
export async function recordDailyStoryView(
  request: Request,
  storyDate: string,
): Promise<void> {
  if (!isIsoDate(storyDate)) return
  const ip = clientIp(request)
  const allowed = await takeRateLimit(`daily-view:${storyDate}:${ip}`, 1, 60 * 60 * 1000)
  if (!allowed) return

  try {
    await sql(
      `insert into daily_page_views (story_date, views, updated_at)
       values ($1::date, 1, now())
       on conflict (story_date) do update
         set views = daily_page_views.views + 1,
             updated_at = now()`,
      [storyDate],
    )
  } catch {
    /* stats must never break reading */
  }
}

export type AdminArchiveItem = {
  date: string
  title: string
  source: string
  wisdomKind: string
  hasImage: boolean
  views: number
  comments: number
  commentsHidden: number
}

export type AdminUsageStats = {
  totalViews: number
  totalComments: number
  totalStories: number
  days: {
    date: string
    views: number
    comments: number
    title: string | null
  }[]
}

export async function listAdminArchive(limit = 120): Promise<AdminArchiveItem[]> {
  const capped = Math.min(Math.max(limit, 1), 365)
  try {
    const rows = await sql<{
      date: string
      title: string | null
      source: string
      wisdom_kind: string | null
      has_image: boolean
      views: number
      comments: number
      comments_hidden: number
    }>(
      `select d.story_date::text as date,
              coalesce(d.payload->>'title', '（無標題）') as title,
              d.source,
              coalesce(d.payload->>'wisdomKind', '') as wisdom_kind,
              (d.image_bytes is not null) as has_image,
              coalesce(v.views, 0)::int as views,
              (
                select count(*)::int from comments c
                where c.story_date = d.story_date and c.hidden = false
              ) as comments,
              (
                select count(*)::int from comments c
                where c.story_date = d.story_date and c.hidden = true
              ) as comments_hidden
       from daily_stories d
       left join daily_page_views v on v.story_date = d.story_date
       where d.source in ('grok', 'sample', 'approved', 'draft')
       order by d.story_date desc
       limit $1`,
      [capped],
    )
    return rows.map((row) => ({
      date: row.date,
      title: row.title || '（無標題）',
      source: row.source,
      wisdomKind: row.wisdom_kind || '',
      hasImage: Boolean(row.has_image),
      views: row.views || 0,
      comments: row.comments || 0,
      commentsHidden: row.comments_hidden || 0,
    }))
  } catch {
    return []
  }
}

export async function getAdminUsageStats(days = 30): Promise<AdminUsageStats> {
  const windowDays = Math.min(Math.max(days, 7), 90)
  const today = dateKey()
  try {
    const totals = await sql<{
      total_views: number
      total_comments: number
      total_stories: number
    }>(
      `select
         coalesce((select sum(views)::int from daily_page_views), 0) as total_views,
         coalesce((select count(*)::int from comments where hidden = false), 0) as total_comments,
         coalesce((
           select count(*)::int from daily_stories
           where source in ('grok', 'sample', 'approved', 'draft')
         ), 0) as total_stories`,
    )

    const series = await sql<{
      date: string
      views: number
      comments: number
      title: string | null
    }>(
      `with days as (
         select generate_series(
           $2::date - ($1::int - 1),
           $2::date,
           '1 day'::interval
         )::date as day
       )
       select days.day::text as date,
              coalesce(v.views, 0)::int as views,
              coalesce((
                select count(*)::int from comments c
                where c.story_date = days.day and c.hidden = false
              ), 0) as comments,
              (
                select d.payload->>'title' from daily_stories d
                where d.story_date = days.day
                  and d.source in ('grok', 'sample', 'approved', 'draft')
                limit 1
              ) as title
       from days
       left join daily_page_views v on v.story_date = days.day
       order by days.day desc`,
      [windowDays, today],
    )

    return {
      totalViews: totals[0]?.total_views ?? 0,
      totalComments: totals[0]?.total_comments ?? 0,
      totalStories: totals[0]?.total_stories ?? 0,
      days: series.map((row) => ({
        date: row.date,
        views: row.views || 0,
        comments: row.comments || 0,
        title: row.title,
      })),
    }
  } catch {
    return { totalViews: 0, totalComments: 0, totalStories: 0, days: [] }
  }
}
