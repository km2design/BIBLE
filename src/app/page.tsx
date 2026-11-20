'use client'

import Link from 'next/link'
import { CHAJI_INTRO, chajiEpisodes, episodesInSeries } from '../data/chaji'

export default function HomePage() {
  const mainEps = episodesInSeries('main')
  const first = chajiEpisodes[0]

  return (
    <main className="page home">
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <div className="hero-stars" />
          <div className="hero-glow" />
          <div className="hero-ridge" />
        </div>
        <header className="hero-brand">
          <div className="brand-lockup">
            <p className="brand-mark">光道</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/chaji/logo.png"
              alt="茶記大作戰"
              className="brand-chaji-logo"
              width={249}
              height={220}
            />
          </div>
          <h1 className="brand-tagline">每日智慧繪卷</h1>
          <p className="brand-lead">
            每日插畫與短篇故事，帶出反思、名言、提醒、警告、勸戒、鼓勵、安慰與同理；附當日靈修，底下還可留言。
          </p>
          <div className="hero-cta">
            <Link className="btn primary" href="/daily">
              打開今日故事
            </Link>
            <Link className="btn ghost" href="/chaji">
              茶記大作戰
            </Link>
          </div>
        </header>
      </section>

      <section className="home-strip">
        <h2>和合本聖經</h2>
        <p className="section-lead">完整 66 卷公眾領域和合本，自由選書、章、節閱讀。</p>
        <Link className="btn soft" href="/bible">
          打開聖經
        </Link>
      </section>

      <section className="home-strip">
        <h2>今日這樣看</h2>
        <p className="section-lead">插畫故事 → 人生智慧一句 → 當日靈修反思 → 留言彼此鼓勵（有留言規則）。</p>
        <Link className="btn soft" href="/daily" style={{ marginTop: '0.35rem' }}>
          進入每日繪卷
        </Link>
      </section>

      <section className="home-strip">
        <h2>茶記大作戰</h2>
        <p className="section-lead">{CHAJI_INTRO}</p>
        <ul className="chaji-home-rail">
          {mainEps.map((ep, i) => (
            <li key={ep.id} style={{ animationDelay: `${0.05 * i}s` }}>
              <Link href={`/chaji/${ep.id}`} className="chaji-rail-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ep.cover} alt="" width={240} height={240} />
                <span>
                  EP.{ep.ep} · {ep.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link className="text-link" href="/chaji" style={{ display: 'block', marginTop: '0.85rem' }}>
          看完整茶記目錄 →
        </Link>
        <Link className="text-link" href={`/chaji/${first.id}`} style={{ display: 'block', marginTop: '0.45rem' }}>
          從第一集開始 →
        </Link>
      </section>
    </main>
  )
}
