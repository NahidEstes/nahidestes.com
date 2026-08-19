import { useInView } from '../../hooks/useInView.js'
import { radarCategories } from '../../data/skills.js'
export default function RadarChart() {
  const [ref, visible] = useInView(0.3)
  const size = 280, center = 140, radius = 110
  const angleStep = (Math.PI * 2) / radarCategories.length
  const point = (val, i) => {
    const angle = angleStep * i - Math.PI / 2
    const r = (val / 100) * radius
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  }
  const dataPoints = radarCategories.map((c, i) => point(visible ? c.value : 0, i))
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'
  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm mx-auto">
        {[.25,.5,.75,1].map((s,i) => <polygon key={i} points={radarCategories.map((_,j) => point(100*s,j).join(',')).join(' ')} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
        {radarCategories.map((_,i) => { const [x,y]=point(100,i); return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" /> })}
        <path d={pathD} fill="rgba(124,58,237,0.25)" stroke="#A855F7" strokeWidth="2" style={{ transition: 'd 1s cubic-bezier(.16,1,.3,1)' }} />
        {dataPoints.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#22D3EE" style={{ transition: 'cx 1s, cy 1s' }} />)}
        {radarCategories.map((c,i) => { const [x,y]=point(118,i); return <text key={c.label} x={x} y={y} fontSize="10" fill="#9CA3AF" textAnchor="middle" fontFamily="JetBrains Mono" dominantBaseline="middle">{c.label}</text> })}
      </svg>
    </div>
  )
}
