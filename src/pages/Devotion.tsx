import { Link } from 'react-router-dom'
import { episodes } from '../data/episodes'

function pickDaily() {
  const day = Math.floor(Date.now() / 86_400_000)
  return episodes[day % episodes.length]
}

export function Devotion() {
  const ep = pickDaily()
  const scene = ep.scenes[ep.scenes.length - 1]

  return (
    <main className="page devotion-page">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← 光道
        </Link>
        <h1>今日靈修</h1>
        <p>經文、默想與簡短禱告——給忙碌日子留一點光。</p>
      </header>

      <article className="devotion-card">
        <p className="devotion-meta">
          {ep.gospelLabel} · {ep.title}
        </p>
        <h2>{ep.devotion.title}</h2>
        <blockquote>
          <p>{scene.verse}</p>
          <cite>{scene.verseRef}</cite>
        </blockquote>
        <p className="devotion-body">{ep.devotion.body}</p>
        <div className="prayer-box">
          <h3>簡短禱告</h3>
          <p>{ep.devotion.prayer}</p>
        </div>
        <Link className="btn primary" to={`/watch/${ep.id}`}>
          觀看這卷繪卷
        </Link>
      </article>
    </main>
  )
}
