'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AudioControls } from '../../components/AudioControls'
import { CommentSection } from '../../components/CommentSection'
import { DollAvatar } from '../../components/DollAvatar'
import type { DollCharacter } from '../../data/characters'
import type { DailyStory } from '../../data/dailyStories'
import { dateKey, getSampleStoryForDate, withCharacter } from '../../data/dailyStories'
import { useAudioSettings } from '../../context/AudioSettings'

type StoryView = DailyStory & { character: DollCharacter }

export function DailyClient() {
  const audio = useAudioSettings()
  const today = dateKey()
  const [story, setStory] = useState<StoryView>(() => withCharacter(getSampleStoryForDate(today)))
  const [source, setSource] = useState<'sample' | 'grok'>('sample')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/daily?date=${encodeURIComponent(today)}`)
        const data = (await res.json()) as { story: StoryView; source: 'sample' | 'grok' }
        if (!cancelled && data.story) {
          setStory(data.story)
          setSource(data.source)
        }
      } catch {
        /* keep sample */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [today])

  return (
    <main className="page daily-page">
      <header className="watch-top daily-top">
        <Link href="/" className="icon-btn" aria-label="返回首頁">
          ←
        </Link>
        <div className="watch-meta">
          <span>每日繪卷 · {today}</span>
          <strong>{loading ? '載入中…' : story.title}</strong>
        </div>
        <AudioControls />
      </header>

      <section className="daily-hero">
        <DollAvatar character={story.character} size="lg" />
        <div>
          <p className="daily-char-name">{story.character.name}</p>
          <p className="daily-char-title">{story.character.title}</p>
          <p className="daily-char-trait">{story.character.trait}</p>
        </div>
      </section>

      <section className="daily-block">
        <span className="wisdom-tag">{story.wisdomKind}</span>
        <h1>{story.title}</h1>
        <p className="daily-story">{story.story}</p>
        {source === 'sample' ? (
          <p className="sample-note">
            目前為示範故事。綁定 Grok／xAI 金鑰後，可由排程（約香港時間每日 00:10）生成當日內容；也可手動觸發 cron。
          </p>
        ) : (
          <p className="sample-note">本篇由 Grok 生成，再經光道呈現。</p>
        )}
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

      <CommentSection date={today} />
    </main>
  )
}
