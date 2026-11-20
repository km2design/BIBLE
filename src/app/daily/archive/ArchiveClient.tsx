'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AudioControls } from '../../../components/AudioControls'
import { DAILY_ARCHIVE_START, dateKey } from '../../../data/dailyStories'

type HistoryItem = {
  date: string
  title: string
  wisdomKind: string
  source: string
  imageUrl: string
}

export function ArchiveClient() {
  const today = dateKey()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pick, setPick] = useState(today)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/daily/history?limit=60')
        const data = (await res.json()) as { items?: HistoryItem[] }
        if (!cancelled) setItems(data.items || [])
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="page daily-page archive-page">
      <header className="watch-top daily-top">
        <Link href="/daily" className="icon-btn" aria-label="返回今日繪卷">
          ←
        </Link>
        <div className="watch-meta">
          <span>往日繪卷</span>
          <strong>重讀已生成的故事</strong>
        </div>
        <AudioControls />
      </header>

      <section className="daily-block archive-picker">
        <p className="archive-lead">從日曆選一天，或點下方已封存的繪卷。</p>
        <label className="daily-date-picker archive-date-field">
          <span>選擇日期</span>
          <input
            type="date"
            min={DAILY_ARCHIVE_START}
            max={today}
            value={pick < DAILY_ARCHIVE_START ? DAILY_ARCHIVE_START : pick}
            onChange={(e) => setPick(e.target.value || today)}
          />
        </label>
        <Link
          href={pick === today ? '/daily' : `/daily?date=${encodeURIComponent(pick)}`}
          className="btn soft"
        >
          打開這一天
        </Link>
      </section>

      <section className="archive-list" aria-label="已封存列表">
        {loading ? <p className="daily-block">載入中…</p> : null}
        {!loading && items.length === 0 ? (
          <p className="daily-block daily-story">尚無封存故事。待今日繪卷寫入後，會出現在這裡。</p>
        ) : null}
        <ul>
          {items.map((item) => (
            <li key={item.date}>
              <Link
                href={item.date === today ? '/daily' : `/daily?date=${encodeURIComponent(item.date)}`}
                className="archive-item"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" width={96} height={144} />
                <div>
                  <time dateTime={item.date}>{item.date}</time>
                  <strong>{item.title}</strong>
                  <span>{item.wisdomKind}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
