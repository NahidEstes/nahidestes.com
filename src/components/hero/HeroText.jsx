import MagneticButton from '../ui/MagneticButton.jsx'
export default function HeroText() {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <div>
      <p className="font-mono text-cyan-400 text-sm mb-4 tracking-widest">// FULL-STACK ENGINEER · UI ARCHITECT</p>
      <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-white">
        Hi, I'm{' '}
        <span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">Nahid Estes</span>
      </h1>
      <p className="text-gray-400 text-lg max-w-md mb-8">I design and build immersive, high-performance digital experiences at the intersection of code and creativity.</p>
      <div className="flex gap-4 flex-wrap">
        <MagneticButton primary onClick={() => scrollTo('projects')}>View Projects</MagneticButton>
        <MagneticButton onClick={() => scrollTo('terminal')}>Open Terminal &gt;_</MagneticButton>
      </div>
    </div>
  )
}
