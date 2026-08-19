import AnimatedText from '../ui/AnimatedText.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import GlassCard from '../ui/GlassCard.jsx'
import RadarChart from './RadarChart.jsx'
import TechNodeGraph from './TechNodeGraph.jsx'
export default function SkillsSection() {
  return (
    <section id="skills" className="py-32 px-6 max-w-6xl mx-auto">
      <AnimatedText><SectionHeading eyebrow="// 02_SKILLS" title="Tech I work with" /></AnimatedText>
      <div className="grid md:grid-cols-2 gap-6">
        <AnimatedText delay={0.05}><GlassCard><h3 className="font-mono text-sm text-cyan-400 mb-4">CAPABILITY_RADAR</h3><RadarChart /></GlassCard></AnimatedText>
        <AnimatedText delay={0.1}><GlassCard><h3 className="font-mono text-sm text-cyan-400 mb-4">STACK_GRAPH (hover nodes)</h3><TechNodeGraph /></GlassCard></AnimatedText>
      </div>
    </section>
  )
}
