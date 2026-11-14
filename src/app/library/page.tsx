'use client'

import Link from 'next/link'
import { episodes, gospelMeta, type Gospel } from '../../data/episodes'

const order: Gospel[] = ['matthew', 'mark', 'luke', 'john']

export default function LibraryPage() {
  return (
    <main className="page library">
      <header className="page-header">
        <Link href="/" className="back-link">
          ← 光道
        </Link>
        <h1>繪卷目錄</h1>
        <p>
          目前主推<strong>馬太福音</strong>完整主線；其他福音稍後擴充。也可直接進入
          <Link href="/matthew" className="text-link" style={{ marginLeft: '0.35rem' }}>
            馬太專頁 →
          </Link>
        </p>
      </header>

      {order.map((g) => {
        const meta = gospelMeta[g]
        const list = episodes.filter((e) => e.gospel === g)
        if (!list.length) return null
        return (
          <section key={g} className="gospel-block">
            <div className="gospel-head" style={{ borderColor: meta.accent }}>
              <h2>{meta.label}</h2>
              <span>{meta.focus}</span>
            </div>
            <ul className="episode-list">
              {list.map((ep) => (
                <li key={ep.id}>
                  <Link href={`/watch/${ep.id}`} className="episode-row">
                    <div>
                      <strong>{ep.title}</strong>
                      <span>
                        {ep.chapter} · {ep.durationLabel}
                      </span>
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
