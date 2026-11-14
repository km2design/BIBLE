'use client'

import Link from 'next/link'
import { episodes } from '../data/episodes'

export default function HomePage() {
  const featured = episodes[0]

  return (
    <main className="page home">
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <div className="hero-stars" />
          <div className="hero-glow" />
          <div className="hero-ridge" />
        </div>
        <header className="hero-brand">
          <p className="brand-mark">光道</p>
          <h1 className="brand-tagline">每日智慧繪卷</h1>
          <p className="brand-lead">3D 公仔角色讀經文，得著人生提醒、安慰與鼓勵；也有四福音故事與靈修同行。</p>
          <div className="hero-cta">
            <Link className="btn primary" href="/daily">
              今日繪卷
            </Link>
            <Link className="btn ghost" href={`/watch/${featured.id}`}>
              看福音故事
            </Link>
          </div>
        </header>
      </section>

      <section className="home-strip">
        <h2>公仔角色陪你讀</h2>
        <p className="section-lead">不一定直接重述經文情節，而是走進日常，帶出反思、勸戒、同理與盼望。</p>
        <Link className="btn soft" href="/daily">
          打開今日故事
        </Link>
      </section>

      <section className="home-strip">
        <h2>耶穌生平精選</h2>
        <p className="section-lead">從伯利恆到空墳，十二卷繪卷串起四福音的核心場景。</p>
        <ul className="episode-rail">
          {episodes.slice(0, 6).map((ep, i) => (
            <li key={ep.id} style={{ animationDelay: `${0.05 * i}s` }}>
              <Link href={`/watch/${ep.id}`} className="rail-card">
                <span className="rail-gospel">{ep.gospelLabel}</span>
                <strong>{ep.title}</strong>
                <span className="rail-sub">{ep.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link className="text-link" href="/library">
          看全部繪卷 →
        </Link>
      </section>

      <section className="home-devotion-tease">
        <h2>今日靈修</h2>
        <p className="section-lead">看完故事，留下片刻安靜，與經文對話；也可以在每日頁留言彼此鼓勵。</p>
        <Link className="btn soft" href="/devotion">
          進入靈修
        </Link>
      </section>
    </main>
  )
}
