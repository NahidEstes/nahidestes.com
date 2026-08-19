import { useScrollProgress } from '../../hooks/useScrollProgress.js'
export default function ScrollProgress() {
  const p = useScrollProgress()
  return <div className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 to-cyan-400 z-50" style={{ width: `${p}%` }} />
}
