import type { Scene } from '../data/episodes'

const paletteGradients: Record<Scene['palette'], string> = {
  night: 'linear-gradient(165deg, #060d14 0%, #122033 38%, #1c3148 68%, #0e1822 100%)',
  dawn: 'linear-gradient(165deg, #141c2a 0%, #3a4558 32%, #b87a4a 68%, #ecd2a8 100%)',
  sea: 'linear-gradient(180deg, #102838 0%, #1f4e66 38%, #3a7a8c 68%, #163848 100%)',
  desert: 'linear-gradient(165deg, #241c12 0%, #6a4e38 38%, #c9a06e 72%, #8a6848 100%)',
  garden: 'linear-gradient(165deg, #12201a 0%, #355848 38%, #7a9a6a 70%, #3f5e48 100%)',
  gold: 'linear-gradient(165deg, #16120c 0%, #4a3820 32%, #c9a05a 66%, #f2dcae 100%)',
  storm: 'linear-gradient(180deg, #080c12 0%, #172430 32%, #2a3848 55%, #0a1018 100%)',
  cross: 'linear-gradient(180deg, #140c0c 0%, #2a1614 40%, #4a2820 72%, #120a0a 100%)',
  empty: 'linear-gradient(165deg, #10161e 0%, #2a3848 40%, #8a9aaa 72%, #d8e0e8 100%)',
}

function Motif({ motif }: { motif: Scene['motif'] }) {
  switch (motif) {
    case 'star':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <defs>
            <radialGradient id="mangerGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#f5e6c8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f5e6c8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="70" cy="42" r="2.2" fill="#f0e6d2" className="twinkle" />
          <circle cx="120" cy="28" r="3" fill="#f0e6d2" className="twinkle d1" />
          <circle cx="168" cy="48" r="2" fill="#f0e6d2" className="twinkle d2" />
          <circle cx="200" cy="70" r="1.6" fill="#f0e6d2" className="twinkle d3" />
          <circle cx="40" cy="78" r="1.8" fill="#f0e6d2" className="twinkle d1" />
          <circle cx="120" cy="55" r="28" fill="url(#mangerGlow)" className="pulse-glow" />
          <path d="M48 210 Q120 175 192 210" fill="rgba(180,130,80,0.25)" />
          <path d="M78 168 h84 v28 H78z" fill="rgba(90,60,35,0.7)" />
          <ellipse cx="120" cy="168" rx="28" ry="10" fill="rgba(240,220,180,0.55)" className="pulse-glow" />
          <path d="M95 168 Q120 145 145 168" fill="rgba(250,235,210,0.75)" />
        </svg>
      )
    case 'dove':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <ellipse cx="120" cy="210" rx="90" ry="16" fill="rgba(90,160,180,0.28)" />
          <path d="M30 200 Q120 160 210 200 Q120 230 30 200" fill="rgba(70,140,165,0.35)" className="wave" />
          <circle cx="120" cy="70" r="36" fill="rgba(240,220,160,0.2)" className="pulse-glow" />
          <path
            d="M120 95c-28 12-46 38-28 58 10 10 26 6 36-4 10 10 26 14 36 4 18-20 0-46-28-58z"
            fill="rgba(245,235,220,0.9)"
            className="float"
          />
          <path d="M92 120 Q70 105 78 88" stroke="rgba(245,235,220,0.7)" strokeWidth="3" fill="none" className="float d1" />
          <path d="M148 120 Q170 105 162 88" stroke="rgba(245,235,220,0.7)" strokeWidth="3" fill="none" className="float" />
        </svg>
      )
    case 'net':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <path d="M10 170 Q120 130 230 170" stroke="rgba(170,210,220,0.35)" fill="none" strokeWidth="2" className="wave" />
          <path d="M10 190 Q120 155 230 190" stroke="rgba(170,210,220,0.22)" fill="none" strokeWidth="2" className="wave d1" />
          <path d="M10 210 Q120 180 230 210" fill="rgba(40,90,110,0.35)" className="wave" />
          <g className="float">
            <path d="M78 95 L120 155 L162 95" stroke="rgba(235,220,190,0.55)" fill="none" strokeWidth="2.5" />
            <path d="M88 110 H152 M95 125 H145 M102 140 H138" stroke="rgba(200,220,230,0.35)" strokeWidth="1.5" />
            <circle cx="120" cy="162" r="10" fill="rgba(212,165,116,0.45)" />
          </g>
          <circle cx="55" cy="100" r="3" fill="rgba(240,230,210,0.4)" className="twinkle" />
        </svg>
      )
    case 'mountain':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <circle cx="175" cy="58" r="18" fill="rgba(240,210,150,0.45)" className="pulse-glow" />
          <path d="M0 220 L60 110 L110 165 L155 70 L240 220 Z" fill="rgba(50,80,65,0.55)" />
          <path d="M40 220 L120 115 L200 220 Z" fill="rgba(75,110,85,0.45)" />
          <circle cx="120" cy="150" r="14" fill="rgba(240,230,210,0.35)" className="pulse-glow d1" />
          <path d="M105 150 h30 M120 135 v30" stroke="rgba(240,230,210,0.5)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    case 'boat':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <path d="M0 165 Q120 120 240 165 Q120 210 0 165" fill="rgba(35,75,95,0.5)" className="wave" />
          <path d="M0 185 Q120 150 240 185" stroke="rgba(180,210,220,0.25)" fill="none" strokeWidth="2" className="wave d1" />
          <g className="float">
            <path d="M70 140 L170 140 L152 168 L88 168 Z" fill="rgba(200,175,135,0.78)" />
            <line x1="120" y1="140" x2="120" y2="70" stroke="rgba(240,230,210,0.65)" strokeWidth="2.5" />
            <path d="M120 70 L158 125 L120 118 Z" fill="rgba(240,230,210,0.5)" />
          </g>
          <circle cx="40" cy="70" r="2" fill="#f0e6d2" className="twinkle" />
          <circle cx="200" cy="55" r="2.5" fill="#f0e6d2" className="twinkle d2" />
        </svg>
      )
    case 'loaves':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <ellipse cx="120" cy="210" rx="95" ry="18" fill="rgba(90,130,80,0.3)" />
          <g className="float">
            <ellipse cx="95" cy="150" rx="34" ry="16" fill="rgba(205,165,105,0.8)" />
            <ellipse cx="145" cy="145" rx="30" ry="14" fill="rgba(185,145,90,0.8)" />
            <ellipse cx="120" cy="168" rx="36" ry="15" fill="rgba(165,125,75,0.75)" />
          </g>
          <path d="M55 120 Q78 95 105 118" stroke="rgba(150,190,210,0.7)" fill="none" strokeWidth="4" strokeLinecap="round" className="float d1" />
          <path d="M135 115 Q160 92 185 120" stroke="rgba(150,190,210,0.55)" fill="none" strokeWidth="4" strokeLinecap="round" className="float" />
          <circle cx="120" cy="70" r="22" fill="rgba(240,210,150,0.2)" className="pulse-glow" />
        </svg>
      )
    case 'path':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <circle cx="55" cy="48" r="2" fill="#f0e6d2" className="twinkle" />
          <circle cx="190" cy="62" r="2.5" fill="#f0e6d2" className="twinkle d1" />
          <circle cx="150" cy="35" r="1.8" fill="#f0e6d2" className="twinkle d2" />
          <path d="M0 220 L70 150 L120 185 L180 95 L240 220 Z" fill="rgba(40,55,70,0.45)" />
          <path
            d="M120 55 Q95 110 118 150 Q145 190 108 235"
            stroke="rgba(212,165,116,0.55)"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="path-draw"
          />
          <circle cx="120" cy="55" r="10" fill="rgba(240,220,160,0.75)" className="pulse-glow" />
          <g className="float">
            <circle cx="95" cy="145" r="7" fill="rgba(230,210,180,0.45)" />
            <circle cx="132" cy="138" r="7" fill="rgba(230,210,180,0.4)" />
          </g>
        </svg>
      )
    case 'tomb':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <circle cx="185" cy="48" r="14" fill="rgba(240,220,180,0.35)" className="pulse-glow" />
          <path d="M45 210 L45 105 Q45 55 120 55 Q195 55 195 105 L195 210" fill="rgba(130,140,150,0.42)" />
          <ellipse cx="120" cy="155" rx="36" ry="52" fill="rgba(15,20,28,0.78)" />
          <circle cx="175" cy="150" r="28" fill="rgba(150,158,168,0.6)" className="float" />
          <path d="M145 150 Q160 120 175 150" fill="rgba(200,205,210,0.25)" />
          <circle cx="70" cy="70" r="2" fill="#f0e6d2" className="twinkle" />
        </svg>
      )
    case 'cross':
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <circle cx="120" cy="58" r="34" fill="rgba(240,190,130,0.12)" className="pulse-glow" />
          <path d="M120 40 V210 M72 88 H168" stroke="rgba(200,155,115,0.65)" strokeWidth="8" strokeLinecap="round" />
          <path d="M30 220 L120 175 L210 220" fill="rgba(60,35,30,0.45)" />
          <circle cx="40" cy="50" r="1.8" fill="#f0e6d2" className="twinkle" />
          <circle cx="200" cy="60" r="2" fill="#f0e6d2" className="twinkle d2" />
        </svg>
      )
    case 'light':
    default:
      return (
        <svg className="motif" viewBox="0 0 240 260" aria-hidden>
          <circle cx="120" cy="110" r="55" fill="rgba(240,210,150,0.18)" className="pulse-glow" />
          <circle cx="120" cy="110" r="26" fill="rgba(250,235,200,0.55)" className="pulse-glow d1" />
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <line
              key={deg}
              x1="120"
              y1="110"
              x2={120 + Math.cos((deg * Math.PI) / 180) * 88}
              y2={110 + Math.sin((deg * Math.PI) / 180) * 88}
              stroke="rgba(240,210,150,0.32)"
              strokeWidth="2.5"
              className="ray"
            />
          ))}
          <ellipse cx="120" cy="210" rx="70" ry="14" fill="rgba(240,210,150,0.15)" />
        </svg>
      )
  }
}

export function SceneArt({ scene, active }: { scene: Scene; active: boolean }) {
  return (
    <div
      className={`scene-art ${active ? 'active' : ''}`}
      style={{ background: paletteGradients[scene.palette] }}
      aria-hidden={!active}
    >
      <div className="scene-wash" />
      <div className="scene-grain" />
      <div className="scene-vignette" />
      <Motif motif={scene.motif} />
      <div className="scene-horizon" />
    </div>
  )
}
