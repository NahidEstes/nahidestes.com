import { useRef } from 'react'
import AnimatedText from '../ui/AnimatedText.jsx'
import { useSoundEffects } from '../../hooks/useSoundEffects.js'
export default function ProjectCard({ project, index, onSelect }) {
  const ref = useRef(null)
  const { hover } = useSoundEffects()
  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX-rect.left-rect.width/2)/rect.width
    const y = (e.clientY-rect.top-rect.height/2)/rect.height
    ref.current.style.transform = `rotateY(${x*10}deg) rotateX(${-y*10}deg) scale(1.02)`
  }
  return (
    <AnimatedText delay={index*.08}>
      <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={() => { ref.current.style.transform='rotateY(0) rotateX(0) scale(1)' }} onMouseEnter={hover} onClick={() => onSelect && onSelect(project)}
        className="glass-panel rounded-xl p-6 card-tilt cursor-pointer shadow-glass" style={{ transformStyle: 'preserve-3d' }}>
        <div className={`w-full h-32 rounded-xl mb-4 bg-gradient-to-br ${project.color} opacity-80`} />
        <h3 className="text-xl font-semibold mb-2 text-white">{project.title}</h3>
        <p className="text-gray-400 text-sm mb-4">{project.desc}</p>
        <div className="flex gap-2 flex-wrap">
          {project.tags.map(t => <span key={t} className="font-mono text-[10px] px-2 py-1 rounded-full border border-white/10 text-cyan-400">{t}</span>)}
        </div>
      </div>
    </AnimatedText>
  )
}
