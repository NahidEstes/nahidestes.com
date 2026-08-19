import { useRef } from 'react'
export function useMagnetic(strength = 0.25) {
  const ref = useRef(null)
  const onMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`
  }
  const onMouseLeave = () => { if (ref.current) ref.current.style.transform = 'translate(0,0)' }
  return { ref, onMouseMove, onMouseLeave }
}
