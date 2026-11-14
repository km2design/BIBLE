'use client'

import Link from 'next/link'
import { matthewEpisodes } from '../data/matthew'

export default function HomePage() {
  const first = matthewEpisodes[0]

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
          <h1 className="brand-tagline">馬太福音繪卷</h1>
          <p className="brand-lead">先看馬太：君王與國度。一路看繪卷，一路讀經文，再走進當日靈修與智慧故事。</p>
          <div className="hero-cta">
            <Link className="btn primary" href={`/watch/${first.id}`}>
              開始馬太福音
            </Link>
            <Link className="btn ghost" href="/matthew">
              看全部目錄
            </Link>
          </div>
        </header>
      </section>

      <section className="home-strip">
        <h2>馬太主線</h2>
        <p className="section-lead">從博士來朝到空墳大使命，{matthewEpisodes.length} 卷串起耶穌在馬太福音中的關鍵場景。</p>
        <ul className="episode-rail">
          {matthewEpisodes.slice(0, 6).map((ep, i) => (
            <li key={ep.id} style={{ animationDelay: `${0.05 * i}s` }}>
              <Link href={`/watch/${ep.id}`} className="rail-card">
                <span className="rail-gospel">
                  {i + 1} · {ep.chapter}
                </span>
                <strong>{ep.title}</strong>
                <span className="rail-sub">{ep.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link className="text-link" href="/matthew">
          看完整馬太目錄 →
        </Link>
      </section>

      <section className="home-strip">
        <h2>公仔角色 · 每日智慧</h2>
        <p className="section-lead">公仔角色讀經得著提醒、安慰與鼓勵；也可留言彼此建立。</p>
        <Link className="btn soft" href="/daily">
          打開今日故事
        </Link>
      </section>

      <section className="home-devotion-tease">
        <h2>今日靈修</h2>
        <p className="section-lead">看完故事，留下片刻安靜，與經文對話。</p>
        <Link className="btn soft" href="/devotion">
          進入靈修
        </Link>
      </section>
    </main>
  )
}
