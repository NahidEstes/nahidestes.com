export default function TerminalOutput({ history, scrollRef }) {
  return (
    <div ref={scrollRef} className="font-mono text-sm flex-1 overflow-y-auto" style={{ scrollbarWidth:'none' }}>
      {history.map((line,i) => <div key={i} className={line.type==='input' ? 'text-cyan-400' : 'text-gray-400'}>{line.type==='input' ? `> ${line.text}` : line.text}</div>)}
    </div>
  )
}
