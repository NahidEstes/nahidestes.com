import { useEffect, useRef } from 'react'
export default function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d')
    let w, h, particles, raf
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const count = window.innerWidth < 768 ? 50 : 120
    particles = Array.from({ length: count }, () => ({ x: Math.random()*w, y: Math.random()*h, vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3, r: Math.random()*1.5+.5 }))
    const draw = () => {
      ctx.clearRect(0,0,w,h)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x<0||p.x>w) p.vx*=-1; if (p.y<0||p.y>h) p.vy*=-1
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle='rgba(124,58,237,0.5)'; ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
}
