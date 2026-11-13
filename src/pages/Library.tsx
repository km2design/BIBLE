import { Link } from 'react-router-dom'
import { episodes, gospelMeta, type Gospel } from '../data/episodes'

const order: Gospel[] = ['matthew', 'mark', 'luke', 'john']

export function Library() {
  return (
    <main className="page library">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← 光道
        </Link>
        <h1>繪卷目錄</h1>
        <p>按四福音瀏覽耶穌生平場景。點進去，邊看邊讀。</p>
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
                  <Link to={`/watch/${ep.id}`} className="episode-row">
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
