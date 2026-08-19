import { useEffect, useState } from 'react'
import { useSound } from '../../context/SoundContext.jsx'
import { useSoundEffects } from '../../hooks/useSoundEffects.js'
const LINKS = [
  { label: 'Home', href: '#home' }, { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' }, { label: 'Projects', href: '#projects' },
  { label: 'Terminal', href: '#terminal' }, { label: 'Contact', href: '#contact' },
]
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { muted, setMuted } = useSound()
  const { hover } = useSoundEffects()
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'glass-panel py-3' : 'py-5 bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <a href="#home" className="font-['Space_Grotesk'] font-bold text-lg text-white">
          N<span className="bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">.</span>Estes
        </a>
        <div className="hidden md:flex gap-8 font-mono text-xs tracking-wider text-gray-400">
          {LINKS.map(l => (
            <a key={l.label} href={l.href} onMouseEnter={hover} className="hover:text-cyan-400 transition-colors relative group">
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>
        <button onClick={() => setMuted(!muted)} className="text-gray-400 hover:text-cyan-400 transition-colors" aria-label="Toggle sound">
          {muted
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>}
        </button>
      </div>
    </nav>
  )
}
