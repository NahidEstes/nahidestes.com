import { useInView } from '../../hooks/useInView.js'
export default function AnimatedText({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView(0.15)
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }} className={className}>
      {children}
    </div>
  )
}
