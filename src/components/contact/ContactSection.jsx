import AnimatedText from '../ui/AnimatedText.jsx'
import SectionHeading from '../ui/SectionHeading.jsx'
import GlassCard from '../ui/GlassCard.jsx'
import ContactForm from './ContactForm.jsx'

const SOCIAL = [
  { label: 'GitHub', href: 'https://github.com/nahidestes', icon: 'GH' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/nahidestes', icon: 'LI' },
  { label: 'Email', href: 'mailto:hello@nahidestes.dev', icon: '@' },
]

export default function ContactSection() {
  return (
    <section id="contact" className="py-32 px-6 max-w-4xl mx-auto">
      <AnimatedText>
        <SectionHeading eyebrow="// 05_CONTACT" title="Let's build something" align="center" />
      </AnimatedText>

      <AnimatedText delay={0.05}>
        <GlassCard className="shadow-glow-violet-sm">
          <ContactForm />
        </GlassCard>
      </AnimatedText>

      <AnimatedText delay={0.1}>
        <div className="flex justify-center gap-6 mt-10">
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="glass-panel px-5 py-3 rounded-full font-mono text-xs text-text-muted
                hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors"
            >
              {s.icon} {s.label}
            </a>
          ))}
        </div>
      </AnimatedText>
    </section>
  )
}
