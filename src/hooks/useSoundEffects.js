import { useRef } from 'react'
import { useSound } from '../context/SoundContext.jsx'
export function useSoundEffects() {
  const { muted } = useSound()
  const ctxRef = useRef(null)
  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctxRef.current
  }
  const play = (freq = 440, duration = 0.05, volume = 0.04) => {
    if (muted) return
    try {
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'; osc.frequency.value = freq; gain.gain.value = volume
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.stop(ctx.currentTime + duration)
    } catch (e) {}
  }
  return {
    hover: () => play(700, 0.03, 0.015),
    click: () => play(520, 0.06, 0.03),
    success: () => play(900, 0.08, 0.04),
    nodeHover: (freq) => play(freq, 0.04, 0.02),
  }
}
