'use client'

import Link from 'next/link'
import { chajiEpisodes } from '../../data/chaji'

function pickDaily() {
  const day = Math.floor(Date.now() / 86_400_000)
  return chajiEpisodes[day % chajiEpisodes.length]
}

export default function DevotionPage() {
  const ep = pickDaily()

  return (
    <main className="page devotion-page">
      <header className="page-header">
        <Link href="/" className="back-link">
          ← 光道
        </Link>
        <h1>今日靈修</h1>
        <p>經文、默想與簡短禱告——給忙碌日子留一點光。也可到「每日」看智慧繪卷並留言。</p>
      </header>

      <article className="devotion-card">
        <p className="devotion-meta">
          {ep.seriesTitle} · EP.{ep.ep}
        </p>
        <h2>{ep.title}</h2>
        <p className="devotion-body">{ep.blurb}</p>
        <div className="prayer-box">
          <h3>簡短禱告</h3>
          <p>主啊，謝謝祢賜下日常裡的溫暖與陪伴，求祢教導我珍惜眼前的人與恩典。阿們。</p>
        </div>
        <div className="hero-cta">
          <Link className="btn primary" href={`/chaji/${ep.id}`}>
            打開這一集
          </Link>
          <Link className="btn ghost" href="/daily">
            每日智慧繪卷
          </Link>
        </div>
      </article>
    </main>
  )
}
