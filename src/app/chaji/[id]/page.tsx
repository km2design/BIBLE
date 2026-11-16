import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getChajiEpisode, nextChajiEpisode } from '../../../data/chaji'

export default async function ChajiEpisodePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ep = getChajiEpisode(id)
  if (!ep) notFound()
  const next = nextChajiEpisode(ep.id)

  return (
    <main className="page chaji-episode-page">
      <header className="watch-top">
        <Link href="/chaji" className="icon-btn" aria-label="返回茶記目錄">
          ←
        </Link>
        <div className="watch-meta">
          <span>
            {ep.seriesTitle} · EP.{ep.ep}
          </span>
          <strong>{ep.title}</strong>
        </div>
        <span style={{ width: 40 }} aria-hidden />
      </header>

      <section className="chaji-hero" aria-label="本集封面">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ep.cover} alt={`${ep.seriesTitle} ${ep.subtitle} ${ep.title}`} width={1200} height={1200} />
      </section>

      <section className="daily-block">
        <p className="devotion-meta">
          {ep.subtitle} · {ep.seriesTitle}
        </p>
        <h1>{ep.title}</h1>
        <p className="daily-story">{ep.blurb}</p>
        <div className="hero-cta" style={{ marginTop: '1.25rem' }}>
          {next ? (
            <Link className="btn primary" href={`/chaji/${next.id}`}>
              下一集 · {next.title}
            </Link>
          ) : (
            <Link className="btn primary" href="/chaji">
              回到茶記目錄
            </Link>
          )}
          <Link className="btn ghost" href="/daily">
            每日繪卷
          </Link>
        </div>
      </section>
    </main>
  )
}
