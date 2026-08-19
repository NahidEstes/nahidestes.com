import ParticleField from './ParticleField.jsx'
import Scene3D from './Scene3D.jsx'
import HeroText from './HeroText.jsx'
export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center grid-bg overflow-hidden pt-24" style={{ background: 'radial-gradient(at 20% 20%,rgba(124,58,237,.25) 0,transparent 50%),radial-gradient(at 80% 0%,rgba(34,211,238,.2) 0,transparent 50%),radial-gradient(at 50% 100%,rgba(244,114,182,.15) 0,transparent 50%),#0A0A0F' }}>
      <ParticleField />
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <HeroText /><Scene3D />
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-gray-500 tracking-widest animate-pulse">scroll to explore ↓</div>
    </section>
  )
}
