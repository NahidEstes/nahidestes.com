import { useRef } from 'react'
import { useSoundEffects } from '../../hooks/useSoundEffects.js'
export default function GlassCard({ children, className = '' }) {
  const ref = useRef(null)
  const { hover } = useSoundEffects()
  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`)
    ref.current.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`)
  }
  return (
    <div ref={ref} onMouseMove={onMouseMove} onMouseEnter={hover}
      className={`glass-panel rounded-xl p-6 relative overflow-hidden card-tilt shadow-glass ${className}`}
      style={{ backgroundImage: 'radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(124,58,237,0.12), transparent 60%)' }}>
      {children}
    </div>
  )
}
