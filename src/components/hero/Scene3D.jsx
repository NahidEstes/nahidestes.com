import { useEffect, useRef } from 'react'
export default function Scene3D() {
  const ref = useRef(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width/2) / rect.width
      const y = (e.clientY - rect.top - rect.height/2) / rect.height
      el.style.transform = `rotateY(${x*30}deg) rotateX(${-y*30}deg)`
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto" style={{ perspective: '1000px' }}>
      <div ref={ref} className="absolute inset-0 transition-transform duration-200 ease-out animate-[float_6s_ease-in-out_infinite]" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0 rounded-full border border-violet-500/40" style={{ transform: 'rotateX(70deg)' }} />
        <div className="absolute inset-4 rounded-full border border-cyan-400/30" style={{ transform: 'rotateY(60deg)' }} />
        <div className="absolute inset-8 rounded-full border border-pink-400/30" style={{ transform: 'rotateX(40deg) rotateY(40deg)' }} />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/30 to-cyan-400/20 blur-2xl animate-[pulseGlow_3s_ease-in-out_infinite]" />
        <div className="absolute inset-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 opacity-80 blur-sm" />
      </div>
    </div>
  )
}
