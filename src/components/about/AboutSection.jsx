import AnimatedText from '../ui/AnimatedText.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import GlassCard from '../ui/GlassCard.jsx'
import BioCard from './BioCard.jsx'
export default function AboutSection() {
  return (
    <section id="about" className="py-32 px-6 max-w-6xl mx-auto">
      <AnimatedText><SectionHeading eyebrow="// 01_ABOUT" title="Engineering meets design" /></AnimatedText>
      <div className="grid md:grid-cols-3 gap-6">
        <AnimatedText delay={0.05} className="md:col-span-2"><BioCard /></AnimatedText>
        <AnimatedText delay={0.1}>
          <GlassCard className="h-full flex flex-col justify-center items-center text-center">
            <div className="font-mono text-4xl font-bold mb-2 bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">5+</div>
            <p className="text-gray-400 text-sm mb-6">years of experience</p>
            <div className="font-mono text-4xl font-bold mb-2 bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">40+</div>
            <p className="text-gray-400 text-sm">projects shipped</p>
          </GlassCard>
        </AnimatedText>
      </div>
    </section>
  )
}
