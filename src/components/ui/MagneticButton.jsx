import { useMagnetic } from '../../hooks/useMagnetic.js'
import { useSoundEffects } from '../../hooks/useSoundEffects.js'
export default function MagneticButton({ children, onClick, primary = false, className = '' }) {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic(0.25)
  const { hover, click } = useSoundEffects()
  return (
    <button ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} onMouseEnter={hover}
      onClick={() => { click(); onClick && onClick() }}
      className={`transition-transform duration-150 px-6 py-3 rounded-full font-medium text-sm border ${primary ? 'bg-gradient-to-r from-violet-600 to-cyan-400 text-black border-transparent shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'border-white/15 text-white hover:border-white/30 bg-white/5'} ${className}`}>
      {children}
    </button>
  )
}
