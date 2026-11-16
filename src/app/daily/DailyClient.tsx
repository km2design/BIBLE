'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { AudioControls } from '../../components/AudioControls'
import { CommentSection } from '../../components/CommentSection'
import type { DollCharacter } from '../../data/characters'
import type { DailyStory } from '../../data/dailyStories'
import { dateKey, getSampleStoryForDate, withCharacter } from '../../data/dailyStories'
import { useAudioSettings } from '../../context/AudioSettings'

type StoryView = DailyStory & { character: DollCharacter }

const DEFAULT_HERO = '/daily/default-hero.jpg'

function DailyClientInner() {
  const audio = useAudioSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  const today = dateKey()
  const requested = searchParams.get('date')
  const viewDate = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : today
  const isToday = viewDate === today

  const [story, setStory] = useState<StoryView>(() =>
    withCharacter({
      ...getSampleStoryForDate(viewDate),
      imageUrl: DEFAULT_HERO,
    }),
  )
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [heroLoaded, setHeroLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMissing(false)
    setHeroLoaded(false)
    ;(async () => {
      try {
        const res = await fetch(`/api/daily?date=${encodeURIComponent(viewDate)}`)
        if (res.status === 404) {
          if (!cancelled) {
            setMissing(true)
            setLoading(false)
          }
          return
        }
        const data = (await res.json()) as { story: StoryView }
        if (!cancelled && data.story) {
          setStory({
            ...data.story,
            imageUrl: data.story.imageUrl || DEFAULT_HERO,
          })
        }
      } catch {
        /* keep fallback story */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [viewDate])

  const heroSrc = story.imageUrl || DEFAULT_HERO

  return (
    <main className="page daily-page">
      <header className="watch-top daily-top">
        <Link href="/" className="icon-btn" aria-label="返回首頁">
          ←
        </Link>
        <div className="watch-meta">
          <span>每日繪卷 · {viewDate}</span>
          <strong>{loading ? '載入中…' : missing ? '尚無此日故事' : story.title}</strong>
        </div>
        <AudioControls />
      </header>

      {missing ? (
        <section className="daily-block">
          <p className="daily-story">這一天還沒有封存的繪卷。請從往日列表選另一天，或回到今日。</p>
          <div className="daily-nav-row">
            <Link href="/daily" className="btn soft">
              回到今日
            </Link>
            <Link href="/daily/archive" className="btn soft">
              往日繪卷
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="daily-hero" aria-label="當日插畫">
            <div className={`daily-hero-frame${heroLoaded ? ' is-ready' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="daily-hero-media"
                src={heroSrc}
                alt={`${story.title}｜${story.character.name}`}
                width={784}
                height={1168}
                onLoad={() => setHeroLoaded(true)}
              />
            </div>
            <div className="daily-hero-caption">
              <p className="daily-char-name">{story.character.name}</p>
              <p className="daily-char-title">{story.character.title}</p>
              <p className="daily-char-trait">{story.character.trait}</p>
            </div>
          </section>

          <nav className="daily-nav-row" aria-label="往日繪卷">
            <Link href="/daily/archive" className="daily-archive-link">
              往日繪卷
            </Link>
            <label className="daily-date-picker">
              <span className="sr-only">選擇日期</span>
              <input
                type="date"
                max={today}
                value={viewDate}
                onChange={(e) => {
                  const next = e.target.value
                  if (!next) return
                  if (next === today) router.push('/daily')
                  else router.push(`/daily?date=${encodeURIComponent(next)}`)
                }}
              />
            </label>
            {!isToday ? (
              <Link href="/daily" className="daily-archive-link">
                今日
              </Link>
            ) : null}
          </nav>

          <section className="daily-block">
            <span className="wisdom-tag">{story.wisdomKind}</span>
            <h1>{story.title}</h1>
            <p className="daily-story">{story.story}</p>
          </section>

          <section className="daily-block verse-block">
            <cite>{story.verseRef}</cite>
            <p>{story.verse}</p>
          </section>

          <section className="daily-block">
            <h2>人生智慧 · {story.wisdomKind}</h2>
            <p className="wisdom-line">「{story.wisdom}」</p>
          </section>

          <section className="daily-block devotion-block">
            <p className="devotion-meta">當日靈修反思</p>
            <h2>{story.devotionTitle}</h2>
            <p className="devotion-body">{story.devotion}</p>
            <div className="prayer-box">
              <h3>簡短禱告</h3>
              <p>{story.prayer}</p>
            </div>
            <button
              type="button"
              className="btn soft"
              onClick={() => {
                audio.unlock()
                audio.playSfx('devotion')
              }}
            >
              播放靈修提示音
            </button>
          </section>

          <CommentSection date={viewDate} />
        </>
      )}
    </main>
  )
}

export function DailyClient() {
  return (
    <Suspense
      fallback={
        <main className="page daily-page">
          <p className="daily-block">載入中…</p>
        </main>
      }
    >
      <DailyClientInner />
    </Suspense>
  )
}
