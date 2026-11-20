'use client'

import Link from 'next/link'
import { CHAJI_INTRO, chajiSeries, episodesInSeries } from '../../data/chaji'

export default function LibraryPage() {
  return (
    <main className="page library">
      <header className="page-header">
        <Link href="/" className="back-link">
          ← 光道
        </Link>
        <h1>繪卷目錄</h1>
        <p>
          現正推出<strong>茶記大作戰</strong>系列。
          <Link href="/chaji" className="text-link" style={{ marginLeft: '0.35rem' }}>
            進入茶記專頁 →
          </Link>
        </p>
        <p className="section-lead" style={{ marginTop: '0.75rem' }}>
          {CHAJI_INTRO}
        </p>
      </header>

      {chajiSeries.map((series) => {
        const list = episodesInSeries(series.id)
        return (
          <section key={series.id} className="gospel-block">
            <div className="gospel-head" style={{ borderColor: '#d4a574' }}>
              <h2>{series.title}</h2>
              <span>{series.tagline}</span>
            </div>
            <ul className="episode-list">
              {list.map((ep) => (
                <li key={ep.id}>
                  <Link href={`/chaji/${ep.id}`} className="episode-row">
                    <div>
                      <strong>
                        EP.{ep.ep} {ep.title}
                      </strong>
                      <span>{ep.subtitle}</span>
                    </div>
                    <span className="chevron" aria-hidden>
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </main>
  )
}
