'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AudioControls } from '../../../components/AudioControls'
import { SceneArt } from '../../../components/SceneArt'
import { useAudioSettings } from '../../../context/AudioSettings'
import { getEpisode } from '../../../data/episodes'
import { nextMatthewEpisode } from '../../../data/matthew'

export default function WatchPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const episode = id ? getEpisode(id) : undefined
  const audio = useAudioSettings()
  const [index, setIndex] = useState(0)
  const [showDevotion, setShowDevotion] = useState(false)
  const [panel, setPanel] = useState<'story' | 'verse'>('story')

  useEffect(() => {
    setIndex(0)
    setShowDevotion(false)
    setPanel('story')
  }, [id])

  useEffect(() => {
    if (!episode) router.replace('/library')
  }, [episode, router])

  if (!episode) return null

  const scene = episode.scenes[index]
  const isLast = index >= episode.scenes.length - 1
  const isFirst = index <= 0

  function next() {
    audio.unlock()
    if (isLast) {
      audio.playSfx('devotion')
      setShowDevotion(true)
      return
    }
    audio.playSfx('scene')
    setIndex((i) => i + 1)
    setPanel('story')
  }

  function prev() {
    audio.unlock()
    if (showDevotion) {
      audio.playSfx('tap')
      setShowDevotion(false)
      return
    }
    audio.playSfx('tap')
    setIndex((i) => Math.max(0, i - 1))
    setPanel('story')
  }

  return (
    <main className="page watch">
      <div className="watch-stage">
        {episode.scenes.map((s, i) => (
          <SceneArt key={s.id} scene={s} active={!showDevotion && i === index} />
        ))}
        {showDevotion && (
          <div className="scene-art active devotion-scene" aria-hidden>
            <div className="scene-grain" />
            <div className="scene-vignette" />
          </div>
        )}

        <header className="watch-top">
          <Link href="/library" className="icon-btn" aria-label="返回目錄">
            ←
          </Link>
          <div className="watch-meta">
            <span>
              {episode.gospelLabel} · {episode.chapter}
            </span>
            <strong>{episode.title}</strong>
          </div>
          <AudioControls />
        </header>

        {!showDevotion ? (
          <div className="watch-bottom">
            <div className="progress" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={episode.scenes.length}>
              {episode.scenes.map((_, i) => (
                <span key={i} className={i <= index ? 'filled' : ''} />
              ))}
            </div>

            <div className="panel-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={panel === 'story'}
                className={panel === 'story' ? 'active' : ''}
                onClick={() => {
                  setPanel('story')
                  audio.playSfx('tap')
                }}
              >
                故事
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panel === 'verse'}
                className={panel === 'verse' ? 'active' : ''}
                onClick={() => {
                  setPanel('verse')
                  audio.playSfx('tap')
                }}
              >
                經文
              </button>
            </div>

            <div className="watch-copy" key={`${scene.id}-${panel}`}>
              {panel === 'story' ? (
                <>
                  <h2>{scene.title}</h2>
                  <p>{scene.narration}</p>
                  <button type="button" className="verse-chip" onClick={() => setPanel('verse')}>
                    查看經文 · {scene.verseRef}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="verse-heading">{scene.title}</h2>
                  <cite className="verse-ref">{scene.verseRef}</cite>
                  <p className="verse-text">{scene.verse}</p>
                </>
              )}
            </div>

            <div className="watch-nav">
              <button type="button" className="btn ghost" onClick={prev} disabled={isFirst}>
                上一幕
              </button>
              <button type="button" className="btn primary" onClick={next}>
                {isLast ? '進入靈修' : '下一幕'}
              </button>
            </div>
          </div>
        ) : (
          <div className="watch-bottom devotion-sheet">
            <p className="devotion-meta">靈修 · {episode.title}</p>
            <h2>{episode.devotion.title}</h2>
            <p className="devotion-body">{episode.devotion.body}</p>
            <div className="prayer-box">
              <h3>簡短禱告</h3>
              <p>{episode.devotion.prayer}</p>
            </div>
            <div className="watch-nav">
              <button type="button" className="btn ghost" onClick={prev}>
                回到最後一幕
              </button>
              {(() => {
                const nextEp = nextMatthewEpisode(episode.id)
                if (nextEp) {
                  return (
                    <Link className="btn primary" href={`/watch/${nextEp.id}`}>
                      下一卷 · {nextEp.title}
                    </Link>
                  )
                }
                return (
                  <Link className="btn primary" href="/matthew">
                    回到馬太目錄
                  </Link>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
