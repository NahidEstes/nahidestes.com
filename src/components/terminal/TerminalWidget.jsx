import { useEffect, useRef, useState } from 'react'
import { commands } from '../../data/commands.js'
import { useSoundEffects } from '../../hooks/useSoundEffects.js'
import TerminalOutput from './TerminalOutput.jsx'
const INIT = [{ type:'output', text:'Welcome to nahid-os v2.4.0' }, { type:'output', text:'Type "help" to see available commands.' }]
export default function TerminalWidget() {
  const [history, setHistory] = useState(INIT)
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState([])
  const [cmdIndex, setCmdIndex] = useState(-1)
  const scrollRef = useRef(null)
  const { click } = useSoundEffects()
  const run = (raw) => {
    const cmd = raw.trim().toLowerCase(); if (!cmd) return
    click(); setCmdHistory(h => [...h, cmd]); setCmdIndex(-1)
    if (cmd === 'clear') { setHistory([]); return }
    const fn = commands[cmd]
    const lines = [{ type:'input', text:cmd }]
    if (fn) { const out = fn(); if (out) out.forEach(t => lines.push({ type:'output', text:t })) }
    else lines.push({ type:'output', text:`command not found: ${cmd} (try "help")` })
    setHistory(h => [...h, ...lines])
  }
  const onKeyDown = (e) => {
    if (e.key==='Enter') { run(input); setInput('') }
    else if (e.key==='ArrowUp' && cmdHistory.length) { const idx=cmdIndex===-1?cmdHistory.length-1:Math.max(0,cmdIndex-1); setCmdIndex(idx); setInput(cmdHistory[idx]) }
    else if (e.key==='ArrowDown' && cmdIndex!==-1) { const idx=cmdIndex+1; if(idx>=cmdHistory.length){setCmdIndex(-1);setInput('')}else{setCmdIndex(idx);setInput(cmdHistory[idx])} }
  }
  useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight }, [history])
  return (
    <div className="relative glass-panel rounded-xl overflow-hidden" style={{ boxShadow:'0 0 40px rgba(34,211,238,0.3)' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/30">
        <div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-yellow-500/70" /><div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 font-mono text-xs text-gray-400">nahid@portfolio:~</span>
      </div>
      <div className="p-4 h-64 flex flex-col">
        <TerminalOutput history={history} scrollRef={scrollRef} />
        <div className="flex items-center font-mono text-sm text-cyan-400 pt-1">
          <span className="mr-2">{'>'}</span>
          <input autoFocus value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKeyDown} className="bg-transparent outline-none flex-1 text-white caret-cyan-400" aria-label="Terminal input" />
          <span className="animate-[blink_1s_step-end_infinite]">_</span>
        </div>
      </div>
    </div>
  )
}
