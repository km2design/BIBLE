import { Link } from 'react-router-dom'
import { episodes } from '../data/episodes'

export function Home() {
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
          <h1 className="brand-tagline">四福音繪卷</h1>
          <p className="brand-lead">一路看动漫，一路讀經文。背景音樂陪伴，靈修經文同行。</p>
          <div className="hero-cta">
            <Link className="btn primary" to={`/watch/${featured.id}`}>
              開始觀看
            </Link>
            <Link className="btn ghost" to="/library">
              瀏覽目錄
            </Link>
          </div>
        </header>
      </section>

      <section className="home-strip">
        <h2>耶穌生平精選</h2>
        <p className="section-lead">從伯利恆到空墳，十二卷繪卷串起四福音的核心場景。</p>
        <ul className="episode-rail">
          {episodes.slice(0, 6).map((ep, i) => (
            <li key={ep.id} style={{ animationDelay: `${0.05 * i}s` }}>
              <Link to={`/watch/${ep.id}`} className="rail-card">
                <span className="rail-gospel">{ep.gospelLabel}</span>
                <strong>{ep.title}</strong>
                <span className="rail-sub">{ep.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link className="text-link" to="/library">
          看全部繪卷 →
        </Link>
      </section>

      <section className="home-devotion-tease">
        <h2>今日靈修</h2>
        <p className="section-lead">看完故事，留下片刻安靜，與經文對話。</p>
        <Link className="btn soft" to="/devotion">
          進入靈修
        </Link>
      </section>
    </main>
  )
}
