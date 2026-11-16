'use client'

type Props = {
  videoId: string
  title: string
}

export function ChajiShortPlayer({ videoId, title }: Props) {
  const watchUrl = `https://www.youtube.com/shorts/${videoId}`
  const embedUrl = `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0`

  return (
    <section className="chaji-short" aria-label={`${title} YouTube Short`}>
      <div className="chaji-short-frame">
        <iframe
          src={embedUrl}
          title={`${title} · YouTube Short`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <a className="chaji-short-fallback" href={watchUrl} target="_blank" rel="noopener noreferrer">
        若無法播放，在 YouTube 開啟 →
      </a>
    </section>
  )
}
