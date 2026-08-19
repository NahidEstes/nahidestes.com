import { useTypewriter } from '../../hooks/useTypewriter.js'
const BOOT = '> initializing_portfolio.exe\n> loading assets...\n> compiling experience...\n> welcome, visitor_'
export default function LoadingScreen({ onDone }) {
  const output = useTypewriter(BOOT, 22, () => setTimeout(onDone, 500))
  return (
    <div className="fixed inset-0 bg-[#0A0A0F] z-50 flex items-center justify-center" style={{ background: 'radial-gradient(at 20% 20%, rgba(124,58,237,0.25) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(34,211,238,0.2) 0px, transparent 50%), #0A0A0F' }}>
      <pre className="font-mono text-cyan-400 text-sm md:text-base whitespace-pre-wrap px-6">
        {output}<span className="animate-[blink_1s_step-end_infinite]">_</span>
      </pre>
    </div>
  )
}
