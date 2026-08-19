import { useEffect, useState } from 'react'
export function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrollable = el.scrollHeight - el.clientHeight
      setProgress(scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll); onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return progress
}
