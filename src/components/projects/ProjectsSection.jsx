import { useState } from 'react'
import AnimatedText from '../ui/AnimatedText.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import { projects } from '../../data/projects.js'
import ProjectCard from './ProjectCard.jsx'
import ProjectModal from './ProjectModal.jsx'
export default function ProjectsSection() {
  const [selected, setSelected] = useState(null)
  return (
    <section id="projects" className="py-32 px-6 max-w-6xl mx-auto">
      <AnimatedText><SectionHeading eyebrow="// 03_PROJECTS" title="Selected work" /></AnimatedText>
      <div className="grid md:grid-cols-2 gap-6">{projects.map((p,i) => <ProjectCard key={p.title} project={p} index={i} onSelect={setSelected} />)}</div>
      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
