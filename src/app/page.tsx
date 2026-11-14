'use client'

import Link from 'next/link'
import { characters } from '../data/characters'
import { matthewEpisodes } from '../data/matthew'
import { DollAvatar } from '../components/DollAvatar'

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
          <h1 className="brand-tagline">每日公仔智慧</h1>
          <p className="brand-lead">
            3D 公仔角色讀經文，得著反思、名言、提醒、警告、勸戒、鼓勵、安慰與同理；附當日靈修，底下還可留言。
          </p>
          <div className="hero-cta">
            <Link className="btn primary" href="/daily">
              打開今日故事
            </Link>
            <Link className="btn ghost" href={`/watch/${first.id}`}>
              看馬太福音
            </Link>
          </div>
        </header>
      </section>

      <section className="home-strip">
        <h2>今日這樣看</h2>
        <p className="section-lead">公仔讀經 → 人生智慧一句 → 當日靈修反思 → 留言彼此鼓勵（有留言規則）。</p>
        <div className="doll-row">
          {characters.slice(0, 4).map((c) => (
            <Link key={c.id} href="/daily" className="doll-chip">
              <DollAvatar character={c} size="sm" />
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
        <Link className="btn soft" href="/daily" style={{ marginTop: '1.1rem' }}>
          進入每日繪卷
        </Link>
      </section>

      <section className="home-strip">
        <h2>馬太福音主線</h2>
        <p className="section-lead">另有 {matthewEpisodes.length} 卷馬太繪卷，從博士來朝到大使命，可連續觀看。</p>
        <ul className="episode-rail">
          {matthewEpisodes.slice(0, 4).map((ep, i) => (
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
    </main>
  )
}
