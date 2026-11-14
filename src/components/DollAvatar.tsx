import type { DollCharacter } from '../data/characters'

export function DollAvatar({
  character,
  size = 'md',
}: {
  character: DollCharacter
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div
      className={`doll-avatar ${size}`}
      style={{ background: character.palette }}
      aria-hidden
    >
      <div className="doll-head">
        <span className="doll-eye left" />
        <span className="doll-eye right" />
        <span className="doll-blush left" />
        <span className="doll-blush right" />
      </div>
      <div className="doll-body" style={{ background: character.accent }} />
    </div>
  )
}
