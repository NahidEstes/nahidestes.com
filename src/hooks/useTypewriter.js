import { useEffect, useState } from 'react'
export function useTypewriter(text, speed = 22, onDone) {
  const [output, setOutput] = useState('')
  useEffect(() => {
    let i = 0; setOutput('')
    const interval = setInterval(() => {
      i += 1; setOutput(text.slice(0, i))
      if (i >= text.length) { clearInterval(interval); if (onDone) onDone() }
    }, speed)
    return () => clearInterval(interval)
  }, [text])
  return output
}
