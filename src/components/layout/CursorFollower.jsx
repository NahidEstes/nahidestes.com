import { useEffect, useRef } from 'react'
export default function CursorFollower() {
  const ref = useRef(null)
  useEffect(() => {
    const move = (e) => { if (ref.current) { ref.current.style.left = `${e.clientX}px`; ref.current.style.top = `${e.clientY}px` } }
    window.addEventListener('mousemove', move); return () => window.removeEventListener('mousemove', move)
  }, [])
  return <div ref={ref} className="hidden md:block fixed w-8 h-8 rounded-full pointer-events-none z-[60] -translate-x-1/2 -translate-y-1/2 border border-cyan-400/40" style={{ transition: 'left .08s linear, top .08s linear' }} />
}
