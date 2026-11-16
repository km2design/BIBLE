import Link from 'next/link'
import { CHAJI_INTRO, chajiSeries, episodesInSeries } from '../../data/chaji'

export default function ChajiPage() {
  return (
    <main className="page chaji-page">
      <header className="page-header">
        <Link href="/" className="back-link">
          ← 光道
        </Link>
        <div className="chaji-brand-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chaji/logo.png" alt="" className="chaji-logo" width={249} height={220} />
          <div>
            <h1>茶記大作戰</h1>
            <p className="chaji-intro">{CHAJI_INTRO}</p>
          </div>
        </div>
      </header>

      {chajiSeries.map((series) => {
        const eps = episodesInSeries(series.id)
        return (
          <section key={series.id} className="chaji-series">
            <div className="chaji-series-head">
              <h2>{series.title}</h2>
              <span>{series.tagline}</span>
            </div>
            <ul className="chaji-episode-grid">
              {eps.map((ep) => (
                <li key={ep.id}>
                  <Link href={`/chaji/${ep.id}`} className="chaji-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ep.cover} alt="" width={600} height={600} />
                    <div className="chaji-card-meta">
                      <span>
                        EP.{ep.ep} · {ep.subtitle}
                      </span>
                      <strong>{ep.title}</strong>
                    </div>
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
