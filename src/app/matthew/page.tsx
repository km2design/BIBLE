'use client'

import Link from 'next/link'
import { matthewEpisodes } from '../../data/matthew'

export default function MatthewPage() {
  const first = matthewEpisodes[0]

  return (
    <main className="page library">
      <header className="page-header">
        <Link href="/" className="back-link">
          ← 光道
        </Link>
        <h1>馬太福音繪卷</h1>
        <p>君王與國度——從博士來朝到大使命，共 {matthewEpisodes.length} 卷。先看這一卷，邊看邊讀經文。</p>
        <Link className="btn primary" href={`/watch/${first.id}`} style={{ marginTop: '1rem' }}>
          從「{first.title}」開始
        </Link>
      </header>

      <section className="gospel-block">
        <div className="gospel-head" style={{ borderColor: '#c4894a' }}>
          <h2>主線目錄</h2>
          <span>14 卷精選</span>
        </div>
        <ol className="episode-list matthew-track">
          {matthewEpisodes.map((ep, i) => (
            <li key={ep.id}>
              <Link href={`/watch/${ep.id}`} className="episode-row">
                <div>
                  <strong>
                    <span className="mt-index">{i + 1}</span>
                    {ep.title}
                  </strong>
                  <span>
                    {ep.chapter} · {ep.durationLabel} · {ep.subtitle}
                  </span>
                </div>
                <span className="chevron" aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
