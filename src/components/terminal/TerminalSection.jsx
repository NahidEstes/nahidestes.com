import AnimatedText from '../ui/AnimatedText.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import TerminalWidget from './TerminalWidget.jsx'
export default function TerminalSection() {
  return (
    <section id="terminal" className="py-32 px-6 max-w-4xl mx-auto">
      <AnimatedText><SectionHeading eyebrow="// 04_TERMINAL" title="Try the CLI" /></AnimatedText>
      <AnimatedText delay={0.05}><TerminalWidget /></AnimatedText>
    </section>
  )
}
