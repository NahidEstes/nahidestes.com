export default function ProjectModal({ project, onClose }) {
  if (!project) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6" onClick={onClose}>
      <div className="glass-panel rounded-xl p-8 max-w-lg w-full shadow-glass relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors" aria-label="Close">✕</button>
        <div className={`w-full h-40 rounded-xl mb-6 bg-gradient-to-br ${project.color} opacity-80`} />
        <h3 className="text-2xl font-semibold mb-3 text-white">{project.title}</h3>
        <p className="text-gray-400 leading-relaxed mb-6">{project.desc}</p>
        <div className="flex gap-2 flex-wrap">{project.tags.map(t => <span key={t} className="font-mono text-[10px] px-2 py-1 rounded-full border border-white/10 text-cyan-400">{t}</span>)}</div>
      </div>
    </div>
  )
}
