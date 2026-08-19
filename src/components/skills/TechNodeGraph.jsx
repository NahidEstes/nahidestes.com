import { useState } from 'react'
import { techNodes } from '../../data/skills.js'
import { useSoundEffects } from '../../hooks/useSoundEffects.js'
export default function TechNodeGraph() {
  const [active, setActive] = useState(null)
  const { nodeHover } = useSoundEffects()
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {techNodes.map((s,i) => techNodes.slice(i+1).map((t,j) => (
          <line key={`${i}-${j}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={active===s.name||active===t.name ? '#22D3EE' : 'rgba(255,255,255,0.07)'} strokeWidth="0.3" />
        )))}
        {techNodes.map(s => (
          <g key={s.name} onMouseEnter={() => { setActive(s.name); nodeHover(700+s.level*2) }} onMouseLeave={() => setActive(null)} style={{ cursor: 'pointer' }}>
            <circle cx={s.x} cy={s.y} r={active===s.name ? 4 : 2.6} fill={s.color} opacity={active===s.name ? 1 : 0.8} style={{ transition: 'r .2s ease' }} />
            <circle cx={s.x} cy={s.y} r={6} fill={s.color} opacity={active===s.name ? 0.15 : 0} />
            <text x={s.x} y={s.y+(s.y>50?9:-7)} fontSize="3.2" textAnchor="middle" fill={s.color} fontFamily="JetBrains Mono" opacity={active===null||active===s.name ? 1 : 0.3}>
              {s.name}{active===s.name ? ` · ${s.level}%` : ''}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
