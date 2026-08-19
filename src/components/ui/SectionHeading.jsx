export default function SectionHeading({ eyebrow, title, align = 'left' }) {
  return (
    <div className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}>
      <p className="font-mono text-xs text-cyan-400 mb-2 tracking-widest">{eyebrow}</p>
      <h2 className="text-4xl md:text-5xl font-semibold text-white">{title}</h2>
    </div>
  )
}
